package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	AllowedOrigin      string
	DatabaseURL        string
	MigrationsPath     string
	AdminPassword      string
	JWTSecret          string
	JWTTTLHours        int
	AWSAccessKeyID     string
	AWSSecretAccessKey string
	AWSRegion          string
	AWSS3Bucket        string
	S3PublicBaseURL    string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	c := &Config{
		Port:               getEnv("PORT", "8080"),
		AllowedOrigin:      getEnv("ALLOWED_ORIGIN", "http://localhost:3000"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		MigrationsPath:     getEnv("MIGRATIONS_PATH", "./migrations"),
		AdminPassword:      os.Getenv("ADMIN_PASSWORD"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		AWSAccessKeyID:     os.Getenv("AWS_ACCESS_KEY_ID"),
		AWSSecretAccessKey: os.Getenv("AWS_SECRET_ACCESS_KEY"),
		AWSRegion:          getEnv("AWS_REGION", "ap-southeast-1"),
		AWSS3Bucket:        os.Getenv("AWS_S3_BUCKET"),
		S3PublicBaseURL:    strings.TrimRight(os.Getenv("S3_PUBLIC_BASE_URL"), "/"),
	}

	ttl, _ := strconv.Atoi(getEnv("JWT_TTL_HOURS", "8"))
	if ttl <= 0 {
		ttl = 8
	}
	c.JWTTTLHours = ttl

	if c.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}
	if c.AdminPassword == "" {
		return nil, fmt.Errorf("ADMIN_PASSWORD is required")
	}
	if c.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}
	if len(c.JWTSecret) < 16 {
		return nil, fmt.Errorf("JWT_SECRET must be at least 16 characters")
	}

	return c, nil
}

func (c *Config) S3Enabled() bool {
	return c.AWSAccessKeyID != "" && c.AWSSecretAccessKey != "" && c.AWSS3Bucket != ""
}

func getEnv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}
