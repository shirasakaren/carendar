package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"

	"github.com/shirasakaren/carendar/apps/backend/internal/httpx"
	"github.com/shirasakaren/carendar/apps/backend/internal/middleware"
	"github.com/shirasakaren/carendar/apps/backend/internal/service"
)

type Deps struct {
	Auth          *service.Auth
	Events        *service.EventService
	S3            *service.S3
	AllowedOrigin string
}

type Handler struct {
	auth   *service.Auth
	events *service.EventService
	s3     *service.S3
}

func NewRouter(deps Deps) http.Handler {
	h := &Handler{
		auth:   deps.Auth,
		events: deps.Events,
		s3:     deps.S3,
	}

	r := chi.NewRouter()
	r.Use(chimw.Recoverer)
	r.Use(middleware.RequestID)
	r.Use(middleware.SecurityHeaders)
	r.Use(middleware.CORS(deps.AllowedOrigin))
	r.Use(middleware.Logger)

	r.Get("/api/healthz", h.Healthz)

	// Public
	r.Get("/api/events", h.ListPublic)
	r.Get("/api/events/{id}", h.GetPublic)
	r.Get("/api/calendar.ics", h.CalendarICS)

	// Admin auth (no JWT required to obtain one). Rate-limited to slow
	// down brute-force attempts.
	r.With(middleware.RateLimit(10, time.Minute)).Post("/api/admin/auth", h.Login)

	// Admin (JWT required)
	r.Group(func(r chi.Router) {
		r.Use(middleware.RequireAdmin(deps.Auth))
		r.Post("/api/admin/logout", h.Logout)
		r.Get("/api/admin/me", h.Me)
		r.Get("/api/admin/events", h.ListAdmin)
		r.Get("/api/admin/events/{id}", h.GetAdmin)
		r.Post("/api/admin/events", h.Create)
		r.Put("/api/admin/events/{id}", h.Update)
		r.Delete("/api/admin/events/{id}", h.Delete)
		r.Post("/api/admin/upload", h.Upload)
	})

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		httpx.Error(w, http.StatusNotFound, "not found")
	})

	return r
}

func (h *Handler) Healthz(w http.ResponseWriter, r *http.Request) {
	httpx.JSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
