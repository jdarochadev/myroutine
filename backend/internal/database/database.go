package database

import (
	"os"
	"path/filepath"

	"myroutine/backend/internal/models"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

func Open(path string) (*gorm.DB, error) {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return nil, err
	}

	db, err := gorm.Open(sqlite.Open(path), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	if err := db.AutoMigrate(&models.Activity{}, &models.StudyTopic{}, &models.StudySubtopic{}); err != nil {
		return nil, err
	}

	return db, nil
}
