package repositories

import (
	"time"

	"myroutine/backend/internal/models"

	"gorm.io/gorm"
)

type ActivityRepository struct {
	db *gorm.DB
}

func NewActivityRepository(db *gorm.DB) *ActivityRepository {
	return &ActivityRepository{db: db}
}

func (r *ActivityRepository) ListForWeek(weekStart time.Time, weekEnd time.Time, query string, category string) ([]models.Activity, error) {
	var activities []models.Activity
	db := r.db.Model(&models.Activity{}).
		Where("type = ? OR (type = ? AND date >= ? AND date <= ?)", models.ActivityTypeFixed, models.ActivityTypeSingle, weekStart, weekEnd)

	if query != "" {
		like := "%" + query + "%"
		db = db.Where("title LIKE ? OR description LIKE ?", like, like)
	}

	if category != "" && category != "all" {
		db = db.Where("category = ?", category)
	}

	if err := db.Order("start_time asc").Find(&activities).Error; err != nil {
		return nil, err
	}

	return activities, nil
}

func (r *ActivityRepository) ListCategories() ([]string, error) {
	var categories []string
	err := r.db.Model(&models.Activity{}).
		Where("category <> ''").
		Distinct().
		Order("category asc").
		Pluck("category", &categories).Error
	return categories, err
}

func (r *ActivityRepository) FindByID(id uint) (*models.Activity, error) {
	var activity models.Activity
	if err := r.db.First(&activity, id).Error; err != nil {
		return nil, err
	}
	return &activity, nil
}

func (r *ActivityRepository) Create(activity *models.Activity) error {
	return r.db.Create(activity).Error
}

func (r *ActivityRepository) Update(activity *models.Activity) error {
	return r.db.Save(activity).Error
}

func (r *ActivityRepository) Delete(id uint) error {
	return r.db.Delete(&models.Activity{}, id).Error
}

func (r *ActivityRepository) DeleteAll() error {
	return r.db.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.Activity{}).Error
}
