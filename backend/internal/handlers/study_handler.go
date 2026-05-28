package handlers

import (
	"myroutine/backend/internal/dto"
	"myroutine/backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

type StudyHandler struct {
	service *services.StudyService
}

func NewStudyHandler(service *services.StudyService) *StudyHandler {
	return &StudyHandler{service: service}
}

func (h *StudyHandler) Register(router fiber.Router) {
	router.Get("/study/topics", h.listTopics)
	router.Post("/study/topics", h.createTopic)
	router.Post("/study/topics/:id/subtopics", h.createSubtopic)
	router.Patch("/study/subtopics/:id/complete", h.completeSubtopic)
	router.Delete("/study/topics/:id", h.deleteTopic)
	router.Delete("/study/subtopics/:id", h.deleteSubtopic)
}

func (h *StudyHandler) listTopics(c *fiber.Ctx) error {
	result, err := h.service.ListTopics()
	if err != nil {
		return err
	}
	return c.JSON(result)
}

func (h *StudyHandler) createTopic(c *fiber.Ctx) error {
	var request dto.StudyTopicRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	result, err := h.service.CreateTopic(request)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

func (h *StudyHandler) createSubtopic(c *fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return err
	}

	var request dto.StudySubtopicRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	result, err := h.service.CreateSubtopic(id, request)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

func (h *StudyHandler) completeSubtopic(c *fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return err
	}

	var request dto.StudyCompleteRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	result, err := h.service.CompleteSubtopic(id, request)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

func (h *StudyHandler) deleteTopic(c *fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return err
	}

	if err := h.service.DeleteTopic(id); err != nil {
		return err
	}
	return c.JSON(fiber.Map{"ok": true})
}

func (h *StudyHandler) deleteSubtopic(c *fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return err
	}

	result, err := h.service.DeleteSubtopic(id)
	if err != nil {
		return err
	}
	return c.JSON(result)
}
