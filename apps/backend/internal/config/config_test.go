package config

import (
	"strings"
	"testing"
)

// setenvs sets KEY=VALUE pairs for the duration of the test; t.Setenv
// restores the previous value automatically on cleanup.
func setenvs(t *testing.T, pairs ...string) {
	t.Helper()
	for _, p := range pairs {
		key, value, _ := strings.Cut(p, "=")
		t.Setenv(key, value)
	}
}

func TestLoadRequiresSecrets(t *testing.T) {
	setenvs(t,
		"DATABASE_URL=postgres://u:p@localhost/db",
		"ADMIN_PASSWORD=",
		"JWT_SECRET=",
	)

	if _, err := Load(); err == nil {
		t.Fatal("expected Load to fail without ADMIN_PASSWORD/JWT_SECRET")
	}
}

func TestLoadRejectsShortJWTSecret(t *testing.T) {
	setenvs(t,
		"DATABASE_URL=postgres://u:p@localhost/db",
		"ADMIN_PASSWORD=pw",
		"JWT_SECRET=short",
	)

	if _, err := Load(); err == nil || !strings.Contains(err.Error(), "at least 16") {
		t.Fatalf("expected short-secret error, got %v", err)
	}
}

func TestLoadDefaults(t *testing.T) {
	setenvs(t,
		"DATABASE_URL=postgres://u:p@localhost/db",
		"ADMIN_PASSWORD=pw",
		"JWT_SECRET=0123456789abcdef",
	)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if cfg.Port != "8080" {
		t.Errorf("port = %q, want 8080", cfg.Port)
	}
	if cfg.MigrationsPath != "./migrations" {
		t.Errorf("migrations path = %q", cfg.MigrationsPath)
	}
	if cfg.JWTTTLHours != 8 {
		t.Errorf("ttl = %d, want 8", cfg.JWTTTLHours)
	}
	if cfg.S3Enabled() {
		t.Error("S3 should be disabled when AWS vars are unset")
	}
}

func TestS3PublicBaseURLTrimsTrailingSlash(t *testing.T) {
	setenvs(t,
		"DATABASE_URL=postgres://u:p@localhost/db",
		"ADMIN_PASSWORD=pw",
		"JWT_SECRET=0123456789abcdef",
		"S3_PUBLIC_BASE_URL=https://cdn.example.com/",
	)

	cfg, err := Load()
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if cfg.S3PublicBaseURL != "https://cdn.example.com" {
		t.Errorf("public base = %q, want trailing slash trimmed", cfg.S3PublicBaseURL)
	}
}
