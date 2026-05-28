package main

import (
	"log"
	"os"

	"myroutine/backend/internal/config"
	"myroutine/backend/internal/database"
	"myroutine/backend/internal/handlers"
	"myroutine/backend/internal/middleware"
	"myroutine/backend/internal/repositories"
	"myroutine/backend/internal/services"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
	"github.com/gofiber/fiber/v2/middleware/recover"
)

func main() {
	cfg := config.Load()
	db, err := database.Open(cfg.DatabasePath)
	if err != nil {
		log.Fatalf("database error: %v", err)
	}

	activityRepository := repositories.NewActivityRepository(db)
	activityService := services.NewActivityService(activityRepository)
	activityHandler := handlers.NewActivityHandler(activityService)
	studyRepository := repositories.NewStudyRepository(db)
	studyService := services.NewStudyService(studyRepository)
	studyHandler := handlers.NewStudyHandler(studyService)

	app := fiber.New(fiber.Config{
		AppName:      "MyRoutine API",
		ErrorHandler: middleware.ErrorHandler,
	})

	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: cfg.AllowOrigins,
		AllowHeaders: "Origin, Content-Type, Accept",
		AllowMethods: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
	}))

	app.Get("/api/health", func(c *fiber.Ctx) error {
		return c.JSON(fiber.Map{"status": "ok"})
	})

	api := app.Group("/api")
	activityHandler.Register(api)
	studyHandler.Register(api)

	log.Printf("api listening on %s", cfg.Address)
	if err := app.Listen(cfg.Address); err != nil {
		log.Println(err)
		os.Exit(1)
	}
}
