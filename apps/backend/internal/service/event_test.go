package service

import (
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/shirasakaren/carendar/apps/backend/internal/model"
)

func testEvent() *model.Event {
	start := time.Date(2026, 9, 10, 9, 0, 0, 0, time.UTC)
	return &model.Event{
		ID:            uuid.New(),
		Title:         "Rapat",
		Category:      model.CategoryInternalEvents,
		StartDatetime: start,
		EndDatetime:   start.Add(90 * time.Minute),
		LocationType:  model.LocationPhysical,
	}
}

func TestValidateRejectsBlankTitle(t *testing.T) {
	e := testEvent()
	e.Title = "   "
	if err := validate(e); err == nil {
		t.Fatal("expected blank title to fail validation")
	}
}

func TestValidateRejectsUnknownCategory(t *testing.T) {
	e := testEvent()
	e.Category = model.Category("not_a_real_one")
	if err := validate(e); err == nil {
		t.Fatal("expected unknown category to fail validation")
	}
}

func TestValidateRejectsEndBeforeStart(t *testing.T) {
	e := testEvent()
	e.EndDatetime = e.StartDatetime.Add(-time.Hour)
	if err := validate(e); err == nil {
		t.Fatal("expected end-before-start to fail validation")
	}
}

func TestValidateDropsLocationForOnlineEvents(t *testing.T) {
	e := testEvent()
	e.LocationType = model.LocationOnline
	loc := "Aula Lab"
	e.Location = &loc
	if err := validate(e); err != nil {
		t.Fatalf("validate: %v", err)
	}
	if e.Location != nil {
		t.Fatal("physical location text should be dropped for online events")
	}
}

func TestNormalizeDefaultsColorFromCategory(t *testing.T) {
	e := testEvent()
	e.Color = ""
	normalize(e)
	if e.Color != model.CategoryInternalEvents.DefaultColor() {
		t.Fatalf("color = %q, want category default %q", e.Color, model.CategoryInternalEvents.DefaultColor())
	}
	if e.Attachments == nil {
		t.Fatal("attachments should default to an empty slice")
	}
	if e.LocationType == "" {
		t.Fatal("location_type should default to physical")
	}
}

func TestNormalizeBlankRuleToNil(t *testing.T) {
	e := testEvent()
	rule := "   "
	e.RecurrenceRule = &rule
	normalize(e)
	if e.RecurrenceRule != nil {
		t.Fatal("blank recurrence rule should collapse to nil")
	}
}

func TestIsRecurring(t *testing.T) {
	e := testEvent()
	if isRecurring(e) {
		t.Fatal("event without a rule is not recurring")
	}
	rule := "FREQ=DAILY"
	e.RecurrenceRule = &rule
	if !isRecurring(e) {
		t.Fatal("event with a rule should be recurring")
	}
}
