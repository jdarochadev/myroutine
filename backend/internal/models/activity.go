package models

import "time"

const (
	ActivityTypeFixed  = "fixed"
	ActivityTypeSingle = "single"
)

type Activity struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	Title           string     `gorm:"not null" json:"title"`
	Description     string     `gorm:"not null" json:"description"`
	StartTime       string     `gorm:"not null;index" json:"startTime"`
	DurationMinutes int        `gorm:"not null" json:"durationMinutes"`
	Type            string     `gorm:"not null;index" json:"type"`
	Date            *time.Time `gorm:"index" json:"date,omitempty"`
	Weekdays        string     `gorm:"type:text;not null;default:'[]'" json:"-"`
	Color           string     `json:"color,omitempty"`
	Category        string     `gorm:"index" json:"category,omitempty"`
	Priority        string     `gorm:"not null;default:medium" json:"priority"`
	Completed       bool       `gorm:"not null;default:false" json:"completed"`
	CompletedDates  string     `gorm:"type:text;not null;default:'[]'" json:"-"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}
