package models

import "time"

type StudyTopic struct {
	ID          uint            `gorm:"primaryKey" json:"id"`
	Title       string          `gorm:"not null" json:"title"`
	Description string          `json:"description,omitempty"`
	Subtopics   []StudySubtopic `gorm:"foreignKey:TopicID" json:"subtopics"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
}

type StudySubtopic struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	TopicID     uint      `gorm:"not null;index" json:"topicId"`
	Title       string    `gorm:"not null" json:"title"`
	Description string    `json:"description,omitempty"`
	Completed   bool      `gorm:"not null;default:false" json:"completed"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}
