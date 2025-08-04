package handler

import (
	"net/http"
	"strings"
	"time"

	"mgm.lab/calendar-backend/internal/httpx"
	"mgm.lab/calendar-backend/internal/model"
)

var jakartaLoc = func() *time.Location {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil || loc == nil {
		return time.UTC
	}
	return loc
}()

// CalendarICS serves a public iCalendar feed of published, subscription-enabled
// events. Calendar apps (Google, Apple, Outlook) poll this URL to keep a
// subscribed calendar in sync. An optional `?categories=a,b` filter narrows the
// feed to the chosen categories.
func (h *Handler) CalendarICS(w http.ResponseWriter, r *http.Request) {
	var categories []model.Category
	if raw := strings.TrimSpace(r.URL.Query().Get("categories")); raw != "" {
		for _, part := range strings.Split(raw, ",") {
			c := model.Category(strings.TrimSpace(part))
			if c.Valid() {
				categories = append(categories, c)
			}
		}
	}

	events, err := h.events.ListForSubscription(r.Context(), categories)
	if err != nil {
		httpx.Error(w, http.StatusInternalServerError, err.Error())
		return
	}

	w.Header().Set("Content-Type", "text/calendar; charset=utf-8")
	w.Header().Set("Content-Disposition", `inline; filename="mgm-calendar.ics"`)
	w.Header().Set("Cache-Control", "public, max-age=900")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(buildICS(events)))
}

func buildICS(events []model.Event) string {
	var b strings.Builder
	writeICSLine(&b, "BEGIN:VCALENDAR")
	writeICSLine(&b, "VERSION:2.0")
	writeICSLine(&b, "PRODID:-//MGM Laboratory//MGM Calendar//EN")
	writeICSLine(&b, "CALSCALE:GREGORIAN")
	writeICSLine(&b, "METHOD:PUBLISH")
	writeICSLine(&b, "X-WR-CALNAME:MGM Calendar")
	writeICSLine(&b, "X-WR-TIMEZONE:Asia/Jakarta")
	stamp := time.Now().UTC()
	for i := range events {
		writeVEvent(&b, &events[i], stamp)
	}
	writeICSLine(&b, "END:VCALENDAR")
	return b.String()
}

func writeVEvent(b *strings.Builder, e *model.Event, stamp time.Time) {
	writeICSLine(b, "BEGIN:VEVENT")
	writeICSLine(b, "UID:"+e.ID.String()+"@calendar.labmgm.org")
	writeICSLine(b, "DTSTAMP:"+formatICSUTC(stamp))
	if e.IsAllDay {
		start := e.StartDatetime.In(jakartaLoc)
		// DTEND for all-day events is exclusive, so add a day to the last date.
		end := e.EndDatetime.In(jakartaLoc).AddDate(0, 0, 1)
		writeICSLine(b, "DTSTART;VALUE=DATE:"+start.Format("20060102"))
		writeICSLine(b, "DTEND;VALUE=DATE:"+end.Format("20060102"))
	} else {
		writeICSLine(b, "DTSTART:"+formatICSUTC(e.StartDatetime))
		writeICSLine(b, "DTEND:"+formatICSUTC(e.EndDatetime))
	}
	writeICSLine(b, "SUMMARY:"+escapeICS(e.Title))
	if e.Location != nil && strings.TrimSpace(*e.Location) != "" {
		writeICSLine(b, "LOCATION:"+escapeICS(*e.Location))
	}
	if desc := buildICSDescription(e); desc != "" {
		writeICSLine(b, "DESCRIPTION:"+escapeICS(desc))
	}
	writeICSLine(b, "CATEGORIES:"+escapeICS(string(e.Category)))
	writeICSLine(b, "LAST-MODIFIED:"+formatICSUTC(e.UpdatedAt))
	writeICSLine(b, "END:VEVENT")
}

func buildICSDescription(e *model.Event) string {
	var parts []string
	if e.MeetingLink != nil && strings.TrimSpace(*e.MeetingLink) != "" {
		parts = append(parts, "Tautan rapat: "+strings.TrimSpace(*e.MeetingLink))
	}
	if e.Dresscode != nil && strings.TrimSpace(*e.Dresscode) != "" {
		parts = append(parts, "Dresscode: "+strings.TrimSpace(*e.Dresscode))
	}
	if len(e.Attendees) > 0 {
		parts = append(parts, "Peserta: "+strings.Join(e.Attendees, ", "))
	}
	return strings.Join(parts, "\n")
}

func formatICSUTC(t time.Time) string {
	return t.UTC().Format("20060102T150405Z")
}

// escapeICS escapes a TEXT value per RFC 5545 §3.3.11.
func escapeICS(s string) string {
	s = strings.ReplaceAll(s, "\\", "\\\\")
	s = strings.ReplaceAll(s, ";", "\\;")
	s = strings.ReplaceAll(s, ",", "\\,")
	s = strings.ReplaceAll(s, "\r\n", "\\n")
	s = strings.ReplaceAll(s, "\n", "\\n")
	s = strings.ReplaceAll(s, "\r", "\\n")
	return s
}

// writeICSLine writes a content line with CRLF endings, folding lines longer
// than 75 octets onto continuation lines (a leading space) per RFC 5545 §3.1.
// Folds respect UTF-8 multi-byte boundaries.
func writeICSLine(b *strings.Builder, line string) {
	bs := []byte(line)
	if len(bs) <= 75 {
		b.WriteString(line)
		b.WriteString("\r\n")
		return
	}
	i := 0
	first := true
	for i < len(bs) {
		max := 75
		if !first {
			max = 74 // leave room for the leading space
		}
		end := i + max
		if end > len(bs) {
			end = len(bs)
		}
		// don't split inside a UTF-8 sequence
		for end > i+1 && end < len(bs) && bs[end]&0xC0 == 0x80 {
			end--
		}
		if !first {
			b.WriteByte(' ')
		}
		b.Write(bs[i:end])
		b.WriteString("\r\n")
		i = end
		first = false
	}
}
