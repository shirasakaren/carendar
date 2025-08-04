package model

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
)

type Category string

const (
	CategoryInternalEvents     Category = "internal_events"
	CategoryExternalEvents     Category = "external_events"
	CategoryRnDWebsite         Category = "rnd_website"
	CategoryRnDGame            Category = "rnd_game"
	CategoryRnDMobile          Category = "rnd_mobile"
	CategoryRnDUX              Category = "rnd_ux"
	CategoryMajorEvents        Category = "major_events"
	CategoryWorkshop           Category = "workshop"
	CategoryProjectDevelopment Category = "project_development"
	CategoryAcademicEvents     Category = "academic_events"
	CategoryHoliday            Category = "holiday"
)

func (c Category) Valid() bool {
	switch c {
	case CategoryInternalEvents, CategoryExternalEvents, CategoryRnDWebsite,
		CategoryRnDGame, CategoryRnDMobile, CategoryRnDUX, CategoryMajorEvents,
		CategoryWorkshop, CategoryProjectDevelopment, CategoryAcademicEvents,
		CategoryHoliday:
		return true
	}
	return false
}

// DefaultColor returns the brand-token hex for a given category. Admin
// overrides via the per-event `color` field are honored on write; this
// is only used when the client did not supply one.
func (c Category) DefaultColor() string {
	switch c {
	case CategoryInternalEvents:
		return "#3a6dc5"
	case CategoryExternalEvents:
		return "#0d9488"
	case CategoryRnDWebsite:
		return "#7c3aed"
	case CategoryRnDGame:
		return "#db2777"
	case CategoryRnDMobile:
		return "#0891b2"
	case CategoryRnDUX:
		return "#ea580c"
	case CategoryMajorEvents:
		return "#0e1116"
	case CategoryWorkshop:
		return "#f7bf33"
	case CategoryProjectDevelopment:
		return "#16a34a"
	case CategoryAcademicEvents:
		return "#92400e"
	case CategoryHoliday:
		return "#f94141"
	}
	return "#3a6dc5"
}

type LocationKind string

const (
	LocationPhysical LocationKind = "physical"
	LocationOnline   LocationKind = "online"
	LocationHybrid   LocationKind = "hybrid"
)

func (l LocationKind) Valid() bool {
	return l == LocationPhysical || l == LocationOnline || l == LocationHybrid
}

type Attachment struct {
	Name string `json:"name"`
	URL  string `json:"url"`
	Type string `json:"type"`
	Size int64  `json:"size,omitempty"`
}

type Event struct {
	ID                uuid.UUID       `json:"id"`
	ParentEventID     *uuid.UUID      `json:"parent_event_id,omitempty"`
	Title             string          `json:"title"`
	Category          Category        `json:"category"`
	Color             string          `json:"color"`
	DescriptionJSON   json.RawMessage `json:"description_json,omitempty"`
	ThumbnailURL      *string         `json:"thumbnail_url,omitempty"`
	StartDatetime     time.Time       `json:"start_datetime"`
	EndDatetime       time.Time       `json:"end_datetime"`
	IsAllDay          bool            `json:"is_all_day"`
	Location          *string         `json:"location,omitempty"`
	LocationType      LocationKind    `json:"location_type"`
	MeetingLink       *string         `json:"meeting_link,omitempty"`
	Dresscode         *string         `json:"dresscode,omitempty"`
	Attendees         []string        `json:"attendees,omitempty"`
	Attachments       []Attachment    `json:"attachments"`
	RecurrenceRule     *string        `json:"recurrence_rule,omitempty"`
	RecurrenceEndDate  *time.Time     `json:"recurrence_end_date,omitempty"`
	IsSeeded           bool           `json:"is_seeded"`
	ShowInSubscription bool           `json:"show_in_subscription"`
	IsPublished        bool           `json:"is_published"`
	CreatedAt         time.Time       `json:"created_at"`
	UpdatedAt         time.Time       `json:"updated_at"`
}
