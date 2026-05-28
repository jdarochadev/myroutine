package config

import "os"

type Config struct {
	Address      string
	DatabasePath string
	AllowOrigins string
}

func Load() Config {
	return Config{
		Address:      getEnv("API_ADDR", ":8080"),
		DatabasePath: getEnv("DATABASE_PATH", "data/myroutine.db"),
		AllowOrigins: getEnv("ALLOW_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"),
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
