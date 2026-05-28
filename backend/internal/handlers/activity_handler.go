package handlers

import (
	"strconv"

	"myroutine/backend/internal/dto"
	"myroutine/backend/internal/services"

	"github.com/gofiber/fiber/v2"
)

type ActivityHandler struct {
	service *services.ActivityService
}

func NewActivityHandler(service *services.ActivityService) *ActivityHandler {
	return &ActivityHandler{service: service}
}

func (h *ActivityHandler) Register(router fiber.Router) {
	router.Get("/activities", h.list)
	router.Post("/activities", h.create)
	router.Delete("/activities", h.deleteAll)
	router.Put("/activities/:id", h.update)
	router.Patch("/activities/:id/complete", h.complete)
	router.Patch("/activities/:id/move", h.move)
	router.Delete("/activities/:id", h.delete)
}

func (h *ActivityHandler) list(c *fiber.Ctx) error {
	weekStart := c.Query("weekStart")
	result, err := h.service.ListWeek(weekStart, c.Query("query"), c.Query("category"))
	if err != nil {
		return err
	}
	return c.JSON(result)
}

func (h *ActivityHandler) create(c *fiber.Ctx) error {
	var request dto.ActivityRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	result, err := h.service.Create(request)
	if err != nil {
		return err
	}
	return c.Status(fiber.StatusCreated).JSON(result)
}

func (h *ActivityHandler) update(c *fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return err
	}

	var request dto.ActivityRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	result, err := h.service.Update(id, request)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

func (h *ActivityHandler) complete(c *fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return err
	}

	var request dto.CompleteRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	result, err := h.service.Complete(id, request)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

func (h *ActivityHandler) move(c *fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return err
	}

	var request dto.MoveRequest
	if err := c.BodyParser(&request); err != nil {
		return fiber.NewError(fiber.StatusBadRequest, "JSON inválido")
	}

	result, err := h.service.Move(id, request)
	if err != nil {
		return err
	}
	return c.JSON(result)
}

func (h *ActivityHandler) delete(c *fiber.Ctx) error {
	id, err := parseID(c)
	if err != nil {
		return err
	}

	if err := h.service.Delete(id); err != nil {
		return err
	}
	return c.JSON(fiber.Map{"ok": true})
}

func (h *ActivityHandler) deleteAll(c *fiber.Ctx) error {
	if err := h.service.DeleteAll(); err != nil {
		return err
	}
	return c.JSON(fiber.Map{"ok": true})
}

func parseID(c *fiber.Ctx) (uint, error) {
	id, err := strconv.ParseUint(c.Params("id"), 10, 64)
	if err != nil || id == 0 {
		return 0, fiber.NewError(fiber.StatusBadRequest, "ID inválido")
	}
	return uint(id), nil
}
