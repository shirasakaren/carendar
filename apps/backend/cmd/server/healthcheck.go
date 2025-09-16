package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/shirasakaren/carendar/apps/backend/internal/config"
)

// healthcheck performs a GET against the running server's liveness probe
// and exits 0 on success. PORT defaults to 8080 like the server itself.
func healthcheck() int {
	cfg, err := config.Load()
	if err != nil {
		// Env may be incomplete in this mode; fall back to the port only.
		cfg = &config.Config{Port: "8080"}
	}
	port := cfg.Port
	if v := os.Getenv("PORT"); v != "" {
		port = v
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get("http://127.0.0.1:" + port + "/api/healthz")
	if err != nil {
		log.Printf("healthcheck: %v", err)
		return 1
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		log.Printf("healthcheck: unexpected status %d", resp.StatusCode)
		return 1
	}
	return 0
}
