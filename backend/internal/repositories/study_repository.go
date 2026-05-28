package repositories

import (
	"myroutine/backend/internal/models"

	"gorm.io/gorm"
)

type StudyRepository struct {
	db *gorm.DB
}

func NewStudyRepository(db *gorm.DB) *StudyRepository {
	return &StudyRepository{db: db}
}

func (r *StudyRepository) ListTopics() ([]models.StudyTopic, error) {
	var topics []models.StudyTopic
	err := r.db.Preload("Subtopics", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at asc")
	}).Order("created_at desc").Find(&topics).Error
	return topics, err
}

func (r *StudyRepository) FindTopicByID(id uint) (*models.StudyTopic, error) {
	var topic models.StudyTopic
	if err := r.db.Preload("Subtopics", func(db *gorm.DB) *gorm.DB {
		return db.Order("created_at asc")
	}).First(&topic, id).Error; err != nil {
		return nil, err
	}
	return &topic, nil
}

func (r *StudyRepository) FindSubtopicByID(id uint) (*models.StudySubtopic, error) {
	var subtopic models.StudySubtopic
	if err := r.db.First(&subtopic, id).Error; err != nil {
		return nil, err
	}
	return &subtopic, nil
}

func (r *StudyRepository) CreateTopic(topic *models.StudyTopic) error {
	return r.db.Create(topic).Error
}

func (r *StudyRepository) CreateSubtopic(subtopic *models.StudySubtopic) error {
	return r.db.Create(subtopic).Error
}

func (r *StudyRepository) UpdateSubtopic(subtopic *models.StudySubtopic) error {
	return r.db.Save(subtopic).Error
}

func (r *StudyRepository) DeleteTopic(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("topic_id = ?", id).Delete(&models.StudySubtopic{}).Error; err != nil {
			return err
		}
		return tx.Delete(&models.StudyTopic{}, id).Error
	})
}

func (r *StudyRepository) DeleteSubtopic(id uint) error {
	return r.db.Delete(&models.StudySubtopic{}, id).Error
}
