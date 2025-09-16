package service

import (
	"testing"
	"time"
)

func jakarta(t *testing.T) *time.Location {
	t.Helper()
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil {
		t.Fatalf("load tz: %v", err)
	}
	return loc
}

func TestExpandRecurrenceDaily(t *testing.T) {
	loc := jakarta(t)
	start := time.Date(2026, 9, 1, 9, 0, 0, 0, loc)
	times, err := ExpandRecurrence("FREQ=DAILY;COUNT=3", start, nil)
	if err != nil {
		t.Fatalf("expand: %v", err)
	}
	// COUNT includes DTSTART itself; the parent row is occurrence #1.
	if len(times) != 2 {
		t.Fatalf("got %d occurrences, want 2", len(times))
	}
	want0 := start.AddDate(0, 0, 1)
	if !times[0].Equal(want0) {
		t.Fatalf("first occurrence = %v, want %v", times[0], want0)
	}
}

func TestExpandRecurrenceBoundedByEndDate(t *testing.T) {
	loc := jakarta(t)
	start := time.Date(2026, 9, 1, 9, 0, 0, 0, loc)
	end := start.AddDate(0, 0, 2) // last eligible day: 3 Sep
	times, err := ExpandRecurrence("FREQ=DAILY", start, &end)
	if err != nil {
		t.Fatalf("expand: %v", err)
	}
	if len(times) != 2 {
		t.Fatalf("got %d occurrences, want 2 (capped by recurrence_end_date)", len(times))
	}
}

func TestExpandRecurrenceRejectsGarbage(t *testing.T) {
	loc := jakarta(t)
	start := time.Date(2026, 9, 1, 9, 0, 0, 0, loc)
	if _, err := ExpandRecurrence("NOT-AN-RRULE", start, nil); err == nil {
		t.Fatal("expected parse error for garbage rule")
	}
	if _, err := ExpandRecurrence("", start, nil); err == nil {
		t.Fatal("expected parse error for empty rule")
	}
}

func TestExpandRecurrenceMonthly(t *testing.T) {
	loc := jakarta(t)
	start := time.Date(2026, 9, 15, 9, 0, 0, 0, loc)
	times, err := ExpandRecurrence("FREQ=MONTHLY;COUNT=3", start, nil)
	if err != nil {
		t.Fatalf("expand: %v", err)
	}
	if len(times) != 2 {
		t.Fatalf("got %d occurrences, want 2", len(times))
	}
	want := start.AddDate(0, 1, 0)
	if !times[0].Equal(want) {
		t.Fatalf("first occurrence = %v, want %v (one month later)", times[0], want)
	}
}

func TestExpandRecurrenceWeeklyByDay(t *testing.T) {
	loc := jakarta(t)
	// 1 Sep 2026 is a Tuesday.
	start := time.Date(2026, 9, 1, 9, 0, 0, 0, loc)
	times, err := ExpandRecurrence("FREQ=WEEKLY;BYDAY=MO,WE", start, nil)
	if err != nil {
		t.Fatalf("expand: %v", err)
	}
	if len(times) == 0 {
		t.Fatal("expected at least one occurrence")
	}
	// Every occurrence must be a Monday or Wednesday.
	for _, ts := range times {
		d := ts.Weekday()
		if d != time.Monday && d != time.Wednesday {
			t.Fatalf("occurrence on %v violates BYDAY=MO,WE", d)
		}
	}
}
