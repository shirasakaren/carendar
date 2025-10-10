package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	_ "time/tzdata" // embed IANA tz data so Asia/Jakarta works in distroless

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	"github.com/shirasakaren/carendar/apps/backend/internal/config"
	"github.com/shirasakaren/carendar/apps/backend/internal/db"
	"github.com/shirasakaren/carendar/apps/backend/internal/handler"
	"github.com/shirasakaren/carendar/apps/backend/internal/repository"
	"github.com/shirasakaren/carendar/apps/backend/internal/service"
)

func main() {
	// `-healthcheck` mode is used by the docker-compose healthcheck: it
	// pings the running server instead of the distroless image needing a
	// shell or wget.
	if len(os.Args) > 1 && os.Args[1] == "-healthcheck" {
		os.Exit(healthcheck())
	}

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("config: %v", err)
	}

	if err := runMigrations(cfg.DatabaseURL, cfg.MigrationsPath); err != nil {
		log.Fatalf("migrate: %v", err)
	}
	log.Println("migrations applied")

	pool, err := db.Connect(context.Background(), cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("db: %v", err)
	}
	defer pool.Close()
	log.Println("connected to postgres")

	repo := repository.NewEventRepository(pool)

	authSvc := service.NewAuth(cfg.AdminPassword, []byte(cfg.JWTSecret), time.Duration(cfg.JWTTTLHours)*time.Hour)
	eventSvc := service.NewEvent(repo)

	var s3Svc *service.S3
	if cfg.S3Enabled() {
		s3Svc, err = service.NewS3(context.Background(), cfg)
		if err != nil {
			log.Printf("s3 init failed (uploads disabled): %v", err)
			s3Svc = nil
		} else {
			log.Println("s3 ready")
		}
	} else {
		log.Println("s3 not configured (uploads disabled)")
	}

	r := handler.NewRouter(handler.Deps{
		Auth:          authSvc,
		Events:        eventSvc,
		S3:            s3Svc,
		AllowedOrigin: cfg.AllowedOrigin,
	})

	srv := &http.Server{
		Addr:              ":" + cfg.Port,
		Handler:           r,
		ReadHeaderTimeout: 10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	go func() {
		log.Printf("listening on :%s (CORS origin: %s)", cfg.Port, cfg.AllowedOrigin)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("listen: %v", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)
	<-stop
	log.Println("shutting down")

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(ctx); err != nil {
		log.Printf("shutdown: %v", err)
	}
}

func runMigrations(dbURL, path string) error {
	m, err := migrate.New("file://"+path, dbURL)
	if err != nil {
		return err
	}
	defer m.Close()
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return err
	}
	return nil
}
