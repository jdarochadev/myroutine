package services

import (
	"strings"

	"myroutine/backend/internal/dto"
	"myroutine/backend/internal/models"
	"myroutine/backend/internal/repositories"
)

type StudyService struct {
	repository *repositories.StudyRepository
}

func NewStudyService(repository *repositories.StudyRepository) *StudyService {
	return &StudyService{repository: repository}
}

func (s *StudyService) ListTopics() ([]dto.StudyTopicResponse, error) {
	topics, err := s.repository.ListTopics()
	if err != nil {
		return nil, err
	}

	response := make([]dto.StudyTopicResponse, 0, len(topics))
	for _, topic := range topics {
		response = append(response, mapStudyTopic(topic))
	}
	return response, nil
}

func (s *StudyService) CreateTopic(request dto.StudyTopicRequest) (dto.StudyTopicResponse, error) {
	title := strings.TrimSpace(request.Title)
	if title == "" {
		return dto.StudyTopicResponse{}, validation("título da trilha é obrigatório")
	}

	topic := &models.StudyTopic{
		Title:       title,
		Description: strings.TrimSpace(request.Description),
	}
	if err := s.repository.CreateTopic(topic); err != nil {
		return dto.StudyTopicResponse{}, err
	}
	return mapStudyTopic(*topic), nil
}

func (s *StudyService) CreateSubtopic(topicID uint, request dto.StudySubtopicRequest) (dto.StudyTopicResponse, error) {
	if _, err := s.repository.FindTopicByID(topicID); err != nil {
		return dto.StudyTopicResponse{}, err
	}

	title := strings.TrimSpace(request.Title)
	if title == "" {
		return dto.StudyTopicResponse{}, validation("título do assunto é obrigatório")
	}

	subtopic := &models.StudySubtopic{
		TopicID:     topicID,
		Title:       title,
		Description: strings.TrimSpace(request.Description),
	}
	if err := s.repository.CreateSubtopic(subtopic); err != nil {
		return dto.StudyTopicResponse{}, err
	}

	topic, err := s.repository.FindTopicByID(topicID)
	if err != nil {
		return dto.StudyTopicResponse{}, err
	}
	return mapStudyTopic(*topic), nil
}

func (s *StudyService) CompleteSubtopic(id uint, request dto.StudyCompleteRequest) (dto.StudyTopicResponse, error) {
	subtopic, err := s.repository.FindSubtopicByID(id)
	if err != nil {
		return dto.StudyTopicResponse{}, err
	}
	subtopic.Completed = request.Completed
	if err := s.repository.UpdateSubtopic(subtopic); err != nil {
		return dto.StudyTopicResponse{}, err
	}

	topic, err := s.repository.FindTopicByID(subtopic.TopicID)
	if err != nil {
		return dto.StudyTopicResponse{}, err
	}
	return mapStudyTopic(*topic), nil
}

func (s *StudyService) DeleteTopic(id uint) error {
	if _, err := s.repository.FindTopicByID(id); err != nil {
		return err
	}
	return s.repository.DeleteTopic(id)
}

func (s *StudyService) DeleteSubtopic(id uint) (dto.StudyTopicResponse, error) {
	subtopic, err := s.repository.FindSubtopicByID(id)
	if err != nil {
		return dto.StudyTopicResponse{}, err
	}
	topicID := subtopic.TopicID
	if err := s.repository.DeleteSubtopic(id); err != nil {
		return dto.StudyTopicResponse{}, err
	}

	topic, err := s.repository.FindTopicByID(topicID)
	if err != nil {
		return dto.StudyTopicResponse{}, err
	}
	return mapStudyTopic(*topic), nil
}

func mapStudyTopic(topic models.StudyTopic) dto.StudyTopicResponse {
	subtopics := make([]dto.StudySubtopicResponse, 0, len(topic.Subtopics))
	completed := 0
	for _, subtopic := range topic.Subtopics {
		if subtopic.Completed {
			completed++
		}
		subtopics = append(subtopics, dto.StudySubtopicResponse{
			ID:          subtopic.ID,
			TopicID:     subtopic.TopicID,
			Title:       subtopic.Title,
			Description: subtopic.Description,
			Completed:   subtopic.Completed,
			CreatedAt:   subtopic.CreatedAt,
			UpdatedAt:   subtopic.UpdatedAt,
		})
	}

	progress := 0
	if len(subtopics) > 0 {
		progress = int(float64(completed) / float64(len(subtopics)) * 100)
	}

	return dto.StudyTopicResponse{
		ID:              topic.ID,
		Title:           topic.Title,
		Description:     topic.Description,
		Subtopics:       subtopics,
		TotalSubtopics:  len(subtopics),
		CompletedCount:  completed,
		ProgressPercent: progress,
		CreatedAt:       topic.CreatedAt,
		UpdatedAt:       topic.UpdatedAt,
	}
}
