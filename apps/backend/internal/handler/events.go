package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/shirasakaren/carendar/apps/backend/internal/httpx"
	"github.com/shirasakaren/carendar/apps/backend/internal/model"
	"github.com/shirasakaren/carendar/apps/backend/internal/repository"
	"github.com/shirasakaren/carendar/apps/backend/internal/service"
)

// ─── Public endpoints ─────────────────────────────────────────────────

func (h *Handler) ListPublic(w http.ResponseWriter, r *http.Request) {
	h.list(w, r, true)
}

func (h *Handler) GetPublic(w http.ResponseWriter, r *http.Request) {
	h.get(w, r, true)
}

// ─── Admin endpoints ──────────────────────────────────────────────────

func (h *Handler) ListAdmin(w http.ResponseWriter, r *http.Request) {
	h.list(w, r, false)
}

func (h *Handler) GetAdmin(w http.ResponseWriter, r *http.Request) {
	h.get(w, r, false)
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req eventRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body: "+err.Error())
		return
	}
	e, err := req.toModel(uuid.New())
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	if err := h.events.Create(r.Context(), e); err != nil {
		if errors.Is(err, service.ErrValidation) {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusCreated, e)
}

func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	existing, err := h.events.Get(r.Context(), id, false)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			httpx.Error(w, http.StatusNotFound, "event not found")
			return
		}
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	// Forbid editing instances directly — admin should edit the parent.
	if existing.ParentEventID != nil {
		httpx.Error(w, http.StatusBadRequest, "edit the parent recurring event, not an instance")
		return
	}

	var req eventRequest
	if err := httpx.DecodeJSON(r, &req); err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid body: "+err.Error())
		return
	}
	e, err := req.toModel(id)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, err.Error())
		return
	}
	// preserve fields not sent by the client
	e.IsSeeded = existing.IsSeeded
	e.CreatedAt = existing.CreatedAt

	if err := h.events.Update(r.Context(), e); err != nil {
		if errors.Is(err, service.ErrValidation) {
			httpx.Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if errors.Is(err, repository.ErrNotFound) {
			httpx.Error(w, http.StatusNotFound, "event not found")
			return
		}
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, e)
}

func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	if err := h.events.Delete(r.Context(), id); err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			httpx.Error(w, http.StatusNotFound, "event not found")
			return
		}
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ─── shared helpers ───────────────────────────────────────────────────

func (h *Handler) list(w http.ResponseWriter, r *http.Request, publishedOnly bool) {
	monthStr := r.URL.Query().Get("month")
	year, month, err := parseMonth(monthStr)
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "month must be YYYY-MM")
		return
	}
	events, err := h.events.ListByMonth(r.Context(), year, month, publishedOnly)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, map[string]any{
		"month":  fmt.Sprintf("%04d-%02d", year, int(month)),
		"events": events,
	})
}

func (h *Handler) get(w http.ResponseWriter, r *http.Request, publishedOnly bool) {
	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		httpx.Error(w, http.StatusBadRequest, "invalid id")
		return
	}
	e, err := h.events.Get(r.Context(), id, publishedOnly)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			httpx.Error(w, http.StatusNotFound, "event not found")
			return
		}
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}
	httpx.JSON(w, http.StatusOK, e)
}

func parseMonth(s string) (int, time.Month, error) {
	if s == "" {
		now := time.Now()
		return now.Year(), now.Month(), nil
	}
	parts := strings.SplitN(s, "-", 2)
	if len(parts) != 2 {
		return 0, 0, fmt.Errorf("invalid month")
	}
	y, err := strconv.Atoi(parts[0])
	if err != nil || y < 1900 || y > 9999 {
		return 0, 0, fmt.Errorf("invalid year")
	}
	m, err := strconv.Atoi(parts[1])
	if err != nil || m < 1 || m > 12 {
		return 0, 0, fmt.Errorf("invalid month number")
	}
	return y, time.Month(m), nil
}

// ─── request DTO ──────────────────────────────────────────────────────

type eventRequest struct {
	Title             string             `json:"title"`
	Category          model.Category     `json:"category"`
	Color             string             `json:"color"`
	DescriptionJSON   json.RawMessage    `json:"description_json"`
	ThumbnailURL      *string            `json:"thumbnail_url"`
	StartDatetime    time.Time           `json:"start_datetime"`
	EndDatetime      time.Time           `json:"end_datetime"`
	IsAllDay          bool               `json:"is_all_day"`
	Location          *string            `json:"location"`
	LocationType      model.LocationKind `json:"location_type"`
	MeetingLink       *string            `json:"meeting_link"`
	Dresscode         *string            `json:"dresscode"`
	Attendees         []string           `json:"attendees"`
	Attachments       []model.Attachment `json:"attachments"`
	RecurrenceRule     *string            `json:"recurrence_rule"`
	RecurrenceEndDate  *string            `json:"recurrence_end_date"` // "YYYY-MM-DD"
	ShowInSubscription bool               `json:"show_in_subscription"`
	IsPublished        bool               `json:"is_published"`
}

func (req *eventRequest) toModel(id uuid.UUID) (*model.Event, error) {
	e := &model.Event{
		ID:              id,
		Title:           strings.TrimSpace(req.Title),
		Category:        req.Category,
		Color:           strings.TrimSpace(req.Color),
		DescriptionJSON: req.DescriptionJSON,
		ThumbnailURL:    trimPtr(req.ThumbnailURL),
		StartDatetime:   req.StartDatetime,
		EndDatetime:     req.EndDatetime,
		IsAllDay:        req.IsAllDay,
		Location:        trimPtr(req.Location),
		LocationType:    req.LocationType,
		MeetingLink:     trimPtr(req.MeetingLink),
		Dresscode:       trimPtr(req.Dresscode),
		Attendees:       trimList(req.Attendees),
		Attachments:        req.Attachments,
		RecurrenceRule:     trimPtr(req.RecurrenceRule),
		ShowInSubscription: req.ShowInSubscription,
		IsPublished:        req.IsPublished,
	}
	if req.RecurrenceEndDate != nil && strings.TrimSpace(*req.RecurrenceEndDate) != "" {
		loc, _ := time.LoadLocation("Asia/Jakarta")
		if loc == nil {
			loc = time.UTC
		}
		t, err := time.ParseInLocation("2006-01-02", strings.TrimSpace(*req.RecurrenceEndDate), loc)
		if err != nil {
			return nil, fmt.Errorf("recurrence_end_date must be YYYY-MM-DD")
		}
		e.RecurrenceEndDate = &t
	}
	return e, nil
}

func trimPtr(s *string) *string {
	if s == nil {
		return nil
	}
	t := strings.TrimSpace(*s)
	if t == "" {
		return nil
	}
	return &t
}

func trimList(in []string) []string {
	if in == nil {
		return nil
	}
	out := make([]string, 0, len(in))
	for _, s := range in {
		if v := strings.TrimSpace(s); v != "" {
			out = append(out, v)
		}
	}
	if len(out) == 0 {
		return nil
	}
	return out
}
