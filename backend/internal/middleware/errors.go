package middleware

import (
	"errors"

	"myroutine/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"gorm.io/gorm"
)

func ErrorHandler(c *fiber.Ctx, err error) error {
	status := fiber.StatusInternalServerError
	message := "Erro interno"

	var fiberError *fiber.Error
	if errors.As(err, &fiberError) {
		status = fiberError.Code
		message = fiberError.Message
	}

	if errors.Is(err, services.ErrValidation) {
		status = fiber.StatusBadRequest
		message = err.Error()
	}

	if errors.Is(err, gorm.ErrRecordNotFound) {
		status = fiber.StatusNotFound
		message = "Atividade não encontrada"
	}

	return c.Status(status).JSON(fiber.Map{"error": message})
}
