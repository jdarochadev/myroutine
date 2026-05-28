package dto

import "time"

type ActivityRequest struct {
	Title           string `json:"title"`
	Description     string `json:"description"`
	StartTime       string `json:"startTime"`
	DurationMinutes int    `json:"durationMinutes"`
	Type            string `json:"type"`
	Date            string `json:"date"`
	Weekdays        []int  `json:"weekdays"`
	Color           string `json:"color"`
	Category        string `json:"category"`
	Priority        string `json:"priority"`
}

type CompleteRequest struct {
	Date      string `json:"date"`
	Completed bool   `json:"completed"`
}

type MoveRequest struct {
	Date        string `json:"date"`
	Weekday     int    `json:"weekday"`
	FromWeekday int    `json:"fromWeekday"`
	StartTime   string `json:"startTime"`
}

type ActivityResponse struct {
	ID              uint      `json:"id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	StartTime       string    `json:"startTime"`
	DurationMinutes int       `json:"durationMinutes"`
	Type            string    `json:"type"`
	Date            string    `json:"date,omitempty"`
	Weekdays        []int     `json:"weekdays"`
	Color           string    `json:"color,omitempty"`
	Category        string    `json:"category,omitempty"`
	Priority        string    `json:"priority"`
	Completed       bool      `json:"completed"`
	CompletedDates  []string  `json:"completedDates"`
	CreatedAt       time.Time `json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

type ActivityOccurrence struct {
	Activity       ActivityResponse `json:"activity"`
	OccurrenceDate string           `json:"occurrenceDate"`
	Weekday        int              `json:"weekday"`
	Completed      bool             `json:"completed"`
}

type WeekStats struct {
	Total          int `json:"total"`
	Completed      int `json:"completed"`
	CompletionRate int `json:"completionRate"`
	TotalMinutes   int `json:"totalMinutes"`
}

type WeekResponse struct {
	WeekStart   string               `json:"weekStart"`
	WeekEnd     string               `json:"weekEnd"`
	Occurrences []ActivityOccurrence `json:"occurrences"`
	Categories  []string             `json:"categories"`
	Stats       WeekStats            `json:"stats"`
}
