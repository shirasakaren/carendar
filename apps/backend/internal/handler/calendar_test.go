package handler

import (
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"

	"github.com/shirasakaren/carendar/apps/backend/internal/model"
)

func mustTime(t *testing.T, s string) time.Time {
	t.Helper()
	parsed, err := time.Parse(time.RFC3339, s)
	if err != nil {
		t.Fatalf("parse %q: %v", s, err)
	}
	return parsed
}

func TestEscapeICS(t *testing.T) {
	got := escapeICS(`Rapat A, B; "demo"\baris1` + "\nbaris2")
	want := `Rapat A\, B\; "demo"\\baris1\nbaris2`
	if got != want {
		t.Fatalf("escapeICS = %q, want %q", got, want)
	}
}

func TestBuildICSAllDay(t *testing.T) {
	id := uuid.New()
	loc := jakartaLoc
	ev := model.Event{
		ID:            id,
		Title:         "Libur Nasional",
		Category:      model.CategoryHoliday,
		IsAllDay:      true,
		StartDatetime: time.Date(2026, 5, 27, 0, 0, 0, 0, loc),
		EndDatetime:   time.Date(2026, 5, 27, 23, 59, 0, 0, loc),
		UpdatedAt:     mustTime(t, "2026-05-01T00:00:00Z"),
	}

	out := buildICS([]model.Event{ev})

	// Every content line must be CRLF-terminated.
	if strings.Contains(strings.ReplaceAll(out, "\r\n", ""), "\n") {
		t.Fatal("found a bare LF; all lines must use CRLF")
	}
	for _, want := range []string{
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"BEGIN:VEVENT",
		"UID:" + id.String() + "@calendar.labmgm.org",
		"DTSTART;VALUE=DATE:20260527",
		"DTEND;VALUE=DATE:20260528", // exclusive end
		"SUMMARY:Libur Nasional",
		"CATEGORIES:holiday",
		"END:VEVENT",
		"END:VCALENDAR",
	} {
		if !strings.Contains(out, want) {
			t.Errorf("ICS missing %q\n---\n%s", want, out)
		}
	}
}

func TestBuildICSTimedUTC(t *testing.T) {
	ev := model.Event{
		ID:            uuid.New(),
		Title:         "Standup",
		Category:      model.CategoryInternalEvents,
		StartDatetime: time.Date(2026, 5, 27, 9, 0, 0, 0, jakartaLoc), // 02:00Z
		EndDatetime:   time.Date(2026, 5, 27, 10, 0, 0, 0, jakartaLoc),
		UpdatedAt:     mustTime(t, "2026-05-01T00:00:00Z"),
	}
	out := buildICS([]model.Event{ev})
	if !strings.Contains(out, "DTSTART:20260527T020000Z") {
		t.Errorf("expected UTC DTSTART, got:\n%s", out)
	}
	if !strings.Contains(out, "DTEND:20260527T030000Z") {
		t.Errorf("expected UTC DTEND, got:\n%s", out)
	}
}

func TestWriteICSLineFolding(t *testing.T) {
	var b strings.Builder
	long := "SUMMARY:" + strings.Repeat("x", 200)
	writeICSLine(&b, long)
	lines := strings.Split(strings.TrimRight(b.String(), "\r\n"), "\r\n")
	if len(lines) < 2 {
		t.Fatalf("expected folded output, got %d line(s)", len(lines))
	}
	for i, ln := range lines {
		if len([]byte(ln)) > 75 {
			t.Errorf("line %d exceeds 75 octets: %d", i, len([]byte(ln)))
		}
		if i > 0 && !strings.HasPrefix(ln, " ") {
			t.Errorf("continuation line %d must start with a space: %q", i, ln)
		}
	}
}

func TestBuildICSDescription(t *testing.T) {
	link := "https://meet.example.com/xyz"
	dress := "Smart casual"
	ev := model.Event{
		MeetingLink: &link,
		Dresscode:   &dress,
		Attendees:   []string{"Idham", "Bu Rina"},
	}
	got := buildICSDescription(&ev)
	for _, want := range []string{
		"Tautan rapat: https://meet.example.com/xyz",
		"Dresscode: Smart casual",
		"Peserta: Idham, Bu Rina",
	} {
		if !strings.Contains(got, want) {
			t.Errorf("description missing %q:\n%s", want, got)
		}
	}
}

func TestBuildICSDescriptionEmpty(t *testing.T) {
	if got := buildICSDescription(&model.Event{}); got != "" {
		t.Fatalf("expected empty description, got %q", got)
	}
}

func TestEscapeICSCRLF(t *testing.T) {
	got := escapeICS("baris1\r\nbaris2\rbaris3")
	want := "baris1\\nbaris2\\nbaris3"
	if got != want {
		t.Fatalf("escapeICS = %q, want %q", got, want)
	}
}
