package service

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"github.com/shirasakaren/carendar/apps/backend/internal/model"
	"github.com/shirasakaren/carendar/apps/backend/internal/repository"
)

var ErrValidation = errors.New("validation")

type EventService struct {
	repo *repository.EventRepository
}

func NewEvent(repo *repository.EventRepository) *EventService {
	return &EventService{repo: repo}
}

func (s *EventService) ListByMonth(ctx context.Context, year int, month time.Month, publishedOnly bool) ([]model.Event, error) {
	return s.repo.ListByMonth(ctx, year, month, publishedOnly)
}

func (s *EventService) Get(ctx context.Context, id uuid.UUID, publishedOnly bool) (*model.Event, error) {
	return s.repo.Get(ctx, id, publishedOnly)
}

// ListForSubscription returns published, subscription-enabled events for the
// public .ics feed, optionally filtered to the given categories.
func (s *EventService) ListForSubscription(ctx context.Context, categories []model.Category) ([]model.Event, error) {
	return s.repo.ListForSubscription(ctx, categories)
}

func (s *EventService) Create(ctx context.Context, e *model.Event) error {
	if err := validate(e); err != nil {
		return err
	}
	normalize(e)
	if err := s.repo.Create(ctx, e); err != nil {
		return err
	}
	if isRecurring(e) {
		if err := s.expandAndInsert(ctx, e); err != nil {
			return err
		}
	}
	return nil
}

func (s *EventService) Update(ctx context.Context, e *model.Event) error {
	if err := validate(e); err != nil {
		return err
	}
	normalize(e)
	if err := s.repo.Update(ctx, e); err != nil {
		return err
	}
	// Wipe any previously generated children and regenerate from the
	// (possibly new) rule. Cheaper than diffing.
	if err := s.repo.DeleteChildren(ctx, e.ID); err != nil {
		return fmt.Errorf("delete children: %w", err)
	}
	if isRecurring(e) {
		if err := s.expandAndInsert(ctx, e); err != nil {
			return err
		}
	}
	return nil
}

func (s *EventService) Delete(ctx context.Context, id uuid.UUID) error {
	return s.repo.Delete(ctx, id)
}

func (s *EventService) expandAndInsert(ctx context.Context, parent *model.Event) error {
	rule := strings.TrimSpace(*parent.RecurrenceRule)
	times, err := ExpandRecurrence(rule, parent.StartDatetime, parent.RecurrenceEndDate)
	if err != nil {
		return fmt.Errorf("expand recurrence: %w", err)
	}
	duration := parent.EndDatetime.Sub(parent.StartDatetime)
	parentID := parent.ID

	for _, t := range times {
		child := *parent
		child.ID = uuid.New()
		child.ParentEventID = &parentID
		child.StartDatetime = t
		child.EndDatetime = t.Add(duration)
		child.RecurrenceRule = nil
		child.RecurrenceEndDate = nil
		if err := s.repo.Create(ctx, &child); err != nil {
			return fmt.Errorf("insert child %s: %w", t.Format(time.RFC3339), err)
		}
	}
	return nil
}

func isRecurring(e *model.Event) bool {
	return e.ParentEventID == nil &&
		e.RecurrenceRule != nil &&
		strings.TrimSpace(*e.RecurrenceRule) != ""
}

func normalize(e *model.Event) {
	if e.Color == "" {
		e.Color = e.Category.DefaultColor()
	}
	if e.Attachments == nil {
		e.Attachments = []model.Attachment{}
	}
	if e.LocationType == "" {
		e.LocationType = model.LocationPhysical
	}
	if e.RecurrenceRule != nil {
		trimmed := strings.TrimSpace(*e.RecurrenceRule)
		if trimmed == "" {
			e.RecurrenceRule = nil
		} else {
			e.RecurrenceRule = &trimmed
		}
	}
}

func validate(e *model.Event) error {
	if strings.TrimSpace(e.Title) == "" {
		return fmt.Errorf("%w: title is required", ErrValidation)
	}
	if !e.Category.Valid() {
		return fmt.Errorf("%w: invalid category %q", ErrValidation, e.Category)
	}
	if e.LocationType != "" && !e.LocationType.Valid() {
		return fmt.Errorf("%w: invalid location_type %q", ErrValidation, e.LocationType)
	}
	if e.EndDatetime.Before(e.StartDatetime) {
		return fmt.Errorf("%w: end_datetime is before start_datetime", ErrValidation)
	}
	if e.LocationType == model.LocationOnline && e.Location != nil && strings.TrimSpace(*e.Location) != "" {
		// physical location text doesn't apply to fully-online events; ignore.
		e.Location = nil
	}
	return nil
}
