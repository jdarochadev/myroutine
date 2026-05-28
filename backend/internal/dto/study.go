package dto

import "time"

type StudyTopicRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type StudySubtopicRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type StudyCompleteRequest struct {
	Completed bool `json:"completed"`
}

type StudySubtopicResponse struct {
	ID          uint      `json:"id"`
	TopicID     uint      `json:"topicId"`
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	Completed   bool      `json:"completed"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type StudyTopicResponse struct {
	ID              uint                    `json:"id"`
	Title           string                  `json:"title"`
	Description     string                  `json:"description,omitempty"`
	Subtopics       []StudySubtopicResponse `json:"subtopics"`
	TotalSubtopics  int                     `json:"totalSubtopics"`
	CompletedCount  int                     `json:"completedCount"`
	ProgressPercent int                     `json:"progressPercent"`
	CreatedAt       time.Time               `json:"createdAt"`
	UpdatedAt       time.Time               `json:"updatedAt"`
}
