package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"myroutine/backend/internal/dto"
	"myroutine/backend/internal/models"
	"myroutine/backend/internal/repositories"
)

var ErrValidation = errors.New("validation error")

type ActivityService struct {
	repository *repositories.ActivityRepository
}

func NewActivityService(repository *repositories.ActivityRepository) *ActivityService {
	return &ActivityService{repository: repository}
}

func (s *ActivityService) ListWeek(weekStartRaw string, query string, category string) (dto.WeekResponse, error) {
	weekStart, err := parseDate(weekStartRaw)
	if err != nil {
		return dto.WeekResponse{}, validation("semana inválida")
	}
	weekStart = monday(weekStart)
	weekEnd := weekStart.AddDate(0, 0, 6)

	activities, err := s.repository.ListForWeek(weekStart, weekEnd, strings.TrimSpace(query), category)
	if err != nil {
		return dto.WeekResponse{}, err
	}

	categories, err := s.repository.ListCategories()
	if err != nil {
		return dto.WeekResponse{}, err
	}

	occurrences := make([]dto.ActivityOccurrence, 0)
	for _, activity := range activities {
		response := mapActivity(activity)
		completedDates := toSet(response.CompletedDates)

		if activity.Type == models.ActivityTypeFixed {
			weekdays := toSetInt(response.Weekdays)
			for day := 0; day < 7; day++ {
				date := weekStart.AddDate(0, 0, day)
				weekday := normalizeWeekday(date)
				if !weekdays[weekday] {
					continue
				}
				dateString := formatDate(date)
				occurrences = append(occurrences, dto.ActivityOccurrence{
					Activity:       response,
					OccurrenceDate: dateString,
					Weekday:        weekday,
					Completed:      completedDates[dateString],
				})
			}
			continue
		}

		if activity.Date == nil {
			continue
		}
		date := *activity.Date
		occurrences = append(occurrences, dto.ActivityOccurrence{
			Activity:       response,
			OccurrenceDate: formatDate(date),
			Weekday:        normalizeWeekday(date),
			Completed:      activity.Completed,
		})
	}

	sort.SliceStable(occurrences, func(i, j int) bool {
		if occurrences[i].OccurrenceDate == occurrences[j].OccurrenceDate {
			return occurrences[i].Activity.StartTime < occurrences[j].Activity.StartTime
		}
		return occurrences[i].OccurrenceDate < occurrences[j].OccurrenceDate
	})

	stats := dto.WeekStats{Total: len(occurrences)}
	for _, occurrence := range occurrences {
		stats.TotalMinutes += occurrence.Activity.DurationMinutes
		if occurrence.Completed {
			stats.Completed++
		}
	}
	if stats.Total > 0 {
		stats.CompletionRate = int(float64(stats.Completed) / float64(stats.Total) * 100)
	}

	return dto.WeekResponse{
		WeekStart:   formatDate(weekStart),
		WeekEnd:     formatDate(weekEnd),
		Occurrences: occurrences,
		Categories:  categories,
		Stats:       stats,
	}, nil
}

func (s *ActivityService) Create(request dto.ActivityRequest) (dto.ActivityResponse, error) {
	activity, err := activityFromRequest(request, nil)
	if err != nil {
		return dto.ActivityResponse{}, err
	}
	if err := s.repository.Create(activity); err != nil {
		return dto.ActivityResponse{}, err
	}
	return mapActivity(*activity), nil
}

func (s *ActivityService) Update(id uint, request dto.ActivityRequest) (dto.ActivityResponse, error) {
	current, err := s.repository.FindByID(id)
	if err != nil {
		return dto.ActivityResponse{}, err
	}

	activity, err := activityFromRequest(request, current)
	if err != nil {
		return dto.ActivityResponse{}, err
	}

	if err := s.repository.Update(activity); err != nil {
		return dto.ActivityResponse{}, err
	}
	return mapActivity(*activity), nil
}

func (s *ActivityService) Delete(id uint) error {
	if _, err := s.repository.FindByID(id); err != nil {
		return err
	}
	return s.repository.Delete(id)
}

func (s *ActivityService) DeleteAll() error {
	return s.repository.DeleteAll()
}

func (s *ActivityService) Complete(id uint, request dto.CompleteRequest) (dto.ActivityResponse, error) {
	activity, err := s.repository.FindByID(id)
	if err != nil {
		return dto.ActivityResponse{}, err
	}

	if _, err := parseDate(request.Date); err != nil {
		return dto.ActivityResponse{}, validation("data inválida")
	}

	if activity.Type == models.ActivityTypeSingle {
		activity.Completed = request.Completed
	} else {
		dates := decodeStrings(activity.CompletedDates)
		set := toSet(dates)
		if request.Completed {
			set[request.Date] = true
		} else {
			delete(set, request.Date)
		}
		activity.CompletedDates = encodeStrings(setToSortedStrings(set))
	}

	if err := s.repository.Update(activity); err != nil {
		return dto.ActivityResponse{}, err
	}
	return mapActivity(*activity), nil
}

func (s *ActivityService) Move(id uint, request dto.MoveRequest) (dto.ActivityResponse, error) {
	activity, err := s.repository.FindByID(id)
	if err != nil {
		return dto.ActivityResponse{}, err
	}

	date, err := parseDate(request.Date)
	if err != nil {
		return dto.ActivityResponse{}, validation("data inválida")
	}
	if !validStartTime(request.StartTime) {
		return dto.ActivityResponse{}, validation("horário inválido")
	}
	if request.Weekday < 1 || request.Weekday > 7 {
		return dto.ActivityResponse{}, validation("dia da semana inválido")
	}
	if request.FromWeekday < 1 || request.FromWeekday > 7 {
		request.FromWeekday = request.Weekday
	}

	activity.StartTime = request.StartTime
	if activity.Type == models.ActivityTypeSingle {
		activity.Date = &date
	} else {
		weekdays := decodeInts(activity.Weekdays)
		if len(weekdays) == 0 {
			weekdays = []int{request.Weekday}
		} else {
			weekdays = replaceWeekday(weekdays, request.FromWeekday, request.Weekday)
		}
		activity.Weekdays = encodeInts(uniqueSortedInts(weekdays))
	}

	if err := s.repository.Update(activity); err != nil {
		return dto.ActivityResponse{}, err
	}
	return mapActivity(*activity), nil
}

func activityFromRequest(request dto.ActivityRequest, current *models.Activity) (*models.Activity, error) {
	request.Title = strings.TrimSpace(request.Title)
	request.Description = strings.TrimSpace(request.Description)
	request.Category = strings.TrimSpace(request.Category)
	request.Priority = strings.TrimSpace(request.Priority)
	request.Type = strings.TrimSpace(request.Type)

	if request.Title == "" {
		return nil, validation("título é obrigatório")
	}
	if request.Description == "" {
		return nil, validation("descrição é obrigatória")
	}
	if !validStartTime(request.StartTime) {
		return nil, validation("horário de início inválido")
	}
	if request.DurationMinutes < 5 || request.DurationMinutes > 1440 {
		return nil, validation("duração deve estar entre 5 e 1440 minutos")
	}
	if request.Priority == "" {
		request.Priority = "medium"
	}
	if request.Priority != "low" && request.Priority != "medium" && request.Priority != "high" {
		return nil, validation("prioridade inválida")
	}
	if request.Type != models.ActivityTypeFixed && request.Type != models.ActivityTypeSingle {
		return nil, validation("tipo de atividade inválido")
	}

	activity := &models.Activity{}
	if current != nil {
		activity = current
	}

	activity.Title = request.Title
	activity.Description = request.Description
	activity.StartTime = request.StartTime
	activity.DurationMinutes = request.DurationMinutes
	activity.Type = request.Type
	activity.Color = request.Color
	activity.Category = request.Category
	activity.Priority = request.Priority

	if request.Type == models.ActivityTypeSingle {
		date, err := parseDate(request.Date)
		if err != nil {
			return nil, validation("data é obrigatória para atividade não fixa")
		}
		activity.Date = &date
		activity.Weekdays = encodeInts([]int{})
		return activity, nil
	}

	weekdays := uniqueSortedInts(request.Weekdays)
	if len(weekdays) == 0 {
		return nil, validation("atividade fixa precisa de ao menos um dia")
	}
	for _, weekday := range weekdays {
		if weekday < 1 || weekday > 7 {
			return nil, validation("dias da semana devem estar entre 1 e 7")
		}
	}
	activity.Date = nil
	activity.Weekdays = encodeInts(weekdays)
	return activity, nil
}

func mapActivity(activity models.Activity) dto.ActivityResponse {
	response := dto.ActivityResponse{
		ID:              activity.ID,
		Title:           activity.Title,
		Description:     activity.Description,
		StartTime:       activity.StartTime,
		DurationMinutes: activity.DurationMinutes,
		Type:            activity.Type,
		Weekdays:        decodeInts(activity.Weekdays),
		Color:           activity.Color,
		Category:        activity.Category,
		Priority:        activity.Priority,
		Completed:       activity.Completed,
		CompletedDates:  decodeStrings(activity.CompletedDates),
		CreatedAt:       activity.CreatedAt,
		UpdatedAt:       activity.UpdatedAt,
	}
	if activity.Date != nil {
		response.Date = formatDate(*activity.Date)
	}
	return response
}

func validation(message string) error {
	return fmt.Errorf("%w: %s", ErrValidation, message)
}

func parseDate(value string) (time.Time, error) {
	return time.ParseInLocation("2006-01-02", value, time.Local)
}

func formatDate(value time.Time) string {
	return value.Format("2006-01-02")
}

func monday(value time.Time) time.Time {
	weekday := int(value.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	return value.AddDate(0, 0, -(weekday - 1))
}

func normalizeWeekday(value time.Time) int {
	weekday := int(value.Weekday())
	if weekday == 0 {
		return 7
	}
	return weekday
}

func validStartTime(value string) bool {
	if len(value) != 5 {
		return false
	}
	_, err := time.Parse("15:04", value)
	return err == nil
}

func decodeInts(value string) []int {
	var result []int
	if err := json.Unmarshal([]byte(value), &result); err != nil {
		return []int{}
	}
	return result
}

func encodeInts(value []int) string {
	encoded, _ := json.Marshal(value)
	return string(encoded)
}

func decodeStrings(value string) []string {
	var result []string
	if err := json.Unmarshal([]byte(value), &result); err != nil {
		return []string{}
	}
	return result
}

func encodeStrings(value []string) string {
	encoded, _ := json.Marshal(value)
	return string(encoded)
}

func uniqueSortedInts(values []int) []int {
	set := map[int]bool{}
	for _, value := range values {
		set[value] = true
	}
	result := make([]int, 0, len(set))
	for value := range set {
		result = append(result, value)
	}
	sort.Ints(result)
	return result
}

func toSet(values []string) map[string]bool {
	set := map[string]bool{}
	for _, value := range values {
		set[value] = true
	}
	return set
}

func toSetInt(values []int) map[int]bool {
	set := map[int]bool{}
	for _, value := range values {
		set[value] = true
	}
	return set
}

func setToSortedStrings(set map[string]bool) []string {
	values := make([]string, 0, len(set))
	for value := range set {
		values = append(values, value)
	}
	sort.Strings(values)
	return values
}

func replaceWeekday(values []int, from int, to int) []int {
	result := make([]int, 0, len(values))
	replaced := false
	for _, value := range values {
		if value == from && !replaced {
			result = append(result, to)
			replaced = true
			continue
		}
		result = append(result, value)
	}
	if !replaced {
		result = append(result, to)
	}
	return result
}
