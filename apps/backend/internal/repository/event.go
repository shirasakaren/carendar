package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/shirasakaren/carendar/apps/backend/internal/model"
)

var ErrNotFound = errors.New("event not found")

// jakartaLoc is resolved once at startup — LoadLocation is a non-trivial
// lookup (tzdata parse + zone pick) and every month-window query pays it.
var jakartaLoc = func() *time.Location {
	loc, err := time.LoadLocation("Asia/Jakarta")
	if err != nil || loc == nil {
		return time.UTC
	}
	return loc
}()

type EventRepository struct {
	pool *pgxpool.Pool
}

func NewEventRepository(pool *pgxpool.Pool) *EventRepository {
	return &EventRepository{pool: pool}
}

const eventColumns = `
    id, parent_event_id, title, category, color, description_json, thumbnail_url,
    start_datetime, end_datetime, is_all_day, location, location_type, meeting_link,
    dresscode, attendees, attachments, recurrence_rule, recurrence_end_date,
    is_seeded, show_in_subscription, is_published, created_at, updated_at`

func (r *EventRepository) Pool() *pgxpool.Pool { return r.pool }

func (r *EventRepository) ListByMonth(ctx context.Context, year int, month time.Month, publishedOnly bool) ([]model.Event, error) {
	monthStart := time.Date(year, month, 1, 0, 0, 0, 0, jakartaLoc)
	monthEnd := monthStart.AddDate(0, 1, 0)

	q := `SELECT ` + eventColumns + `
		FROM events
		WHERE start_datetime < $2 AND end_datetime >= $1`
	if publishedOnly {
		q += ` AND is_published = TRUE`
	}
	q += ` ORDER BY start_datetime ASC, created_at ASC`

	rows, err := r.pool.Query(ctx, q, monthStart, monthEnd)
	if err != nil {
		return nil, fmt.Errorf("list by month: %w", err)
	}
	defer rows.Close()

	out := make([]model.Event, 0, 32)
	for rows.Next() {
		e, err := scanEvent(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *e)
	}
	return out, rows.Err()
}

func (r *EventRepository) Get(ctx context.Context, id uuid.UUID, publishedOnly bool) (*model.Event, error) {
	q := `SELECT ` + eventColumns + ` FROM events WHERE id = $1`
	if publishedOnly {
		q += ` AND is_published = TRUE`
	}
	row := r.pool.QueryRow(ctx, q, id)
	e, err := scanEvent(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return e, err
}

func (r *EventRepository) Create(ctx context.Context, e *model.Event) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	attachmentsJSON, err := marshalAttachments(e.Attachments)
	if err != nil {
		return err
	}
	descJSON := nullableJSON(e.DescriptionJSON)

	q := `INSERT INTO events (
		id, parent_event_id, title, category, color, description_json, thumbnail_url,
		start_datetime, end_datetime, is_all_day, location, location_type, meeting_link,
		dresscode, attendees, attachments, recurrence_rule, recurrence_end_date,
		is_seeded, show_in_subscription, is_published
	) VALUES (
		$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
	) RETURNING created_at, updated_at`

	return r.pool.QueryRow(ctx, q,
		e.ID, nullableUUID(e.ParentEventID), e.Title, string(e.Category), e.Color, descJSON, e.ThumbnailURL,
		e.StartDatetime, e.EndDatetime, e.IsAllDay, e.Location, string(e.LocationType), e.MeetingLink,
		e.Dresscode, e.Attendees, attachmentsJSON, e.RecurrenceRule, e.RecurrenceEndDate,
		e.IsSeeded, e.ShowInSubscription, e.IsPublished,
	).Scan(&e.CreatedAt, &e.UpdatedAt)
}

func (r *EventRepository) Update(ctx context.Context, e *model.Event) error {
	attachmentsJSON, err := marshalAttachments(e.Attachments)
	if err != nil {
		return err
	}
	descJSON := nullableJSON(e.DescriptionJSON)

	q := `UPDATE events SET
		title = $2, category = $3, color = $4, description_json = $5, thumbnail_url = $6,
		start_datetime = $7, end_datetime = $8, is_all_day = $9, location = $10,
		location_type = $11, meeting_link = $12, dresscode = $13, attendees = $14,
		attachments = $15, recurrence_rule = $16, recurrence_end_date = $17,
		show_in_subscription = $18, is_published = $19
	WHERE id = $1
	RETURNING updated_at`

	row := r.pool.QueryRow(ctx, q,
		e.ID, e.Title, string(e.Category), e.Color, descJSON, e.ThumbnailURL,
		e.StartDatetime, e.EndDatetime, e.IsAllDay, e.Location,
		string(e.LocationType), e.MeetingLink, e.Dresscode, e.Attendees,
		attachmentsJSON, e.RecurrenceRule, e.RecurrenceEndDate, e.ShowInSubscription, e.IsPublished,
	)
	if err := row.Scan(&e.UpdatedAt); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return ErrNotFound
		}
		return fmt.Errorf("update: %w", err)
	}
	return nil
}

func (r *EventRepository) Delete(ctx context.Context, id uuid.UUID) error {
	ct, err := r.pool.Exec(ctx, `DELETE FROM events WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("delete: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

// DeleteChildren removes all generated recurrence instances under a parent.
// The parent itself is left untouched.
func (r *EventRepository) DeleteChildren(ctx context.Context, parentID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM events WHERE parent_event_id = $1`, parentID)
	return err
}

// ListForSubscription returns every published event flagged for calendar
// subscription, optionally narrowed to the given categories. Used to build
// the public .ics feed. Recurrence instances are included; their parents
// (which carry the rule but no concrete occurrence) are excluded.
func (r *EventRepository) ListForSubscription(ctx context.Context, categories []model.Category) ([]model.Event, error) {
	q := `SELECT ` + eventColumns + `
		FROM events
		WHERE is_published = TRUE
		  AND show_in_subscription = TRUE
		  AND recurrence_rule IS NULL`
	args := []any{}
	if len(categories) > 0 {
		cats := make([]string, len(categories))
		for i, c := range categories {
			cats[i] = string(c)
		}
		q += ` AND category = ANY($1)`
		args = append(args, cats)
	}
	q += ` ORDER BY start_datetime ASC, created_at ASC`

	rows, err := r.pool.Query(ctx, q, args...)
	if err != nil {
		return nil, fmt.Errorf("list for subscription: %w", err)
	}
	defer rows.Close()

	out := make([]model.Event, 0, 64)
	for rows.Next() {
		e, err := scanEvent(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *e)
	}
	return out, rows.Err()
}

// ─── helpers ──────────────────────────────────────────────────────────

type scannable interface {
	Scan(dest ...any) error
}

func scanEvent(s scannable) (*model.Event, error) {
	var (
		e               model.Event
		parentID        *uuid.UUID
		descBytes       []byte
		attachmentBytes []byte
		category        string
		locationType    string
	)

	err := s.Scan(
		&e.ID, &parentID, &e.Title, &category, &e.Color, &descBytes, &e.ThumbnailURL,
		&e.StartDatetime, &e.EndDatetime, &e.IsAllDay, &e.Location, &locationType, &e.MeetingLink,
		&e.Dresscode, &e.Attendees, &attachmentBytes, &e.RecurrenceRule, &e.RecurrenceEndDate,
		&e.IsSeeded, &e.ShowInSubscription, &e.IsPublished, &e.CreatedAt, &e.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	e.ParentEventID = parentID
	e.Category = model.Category(category)
	e.LocationType = model.LocationKind(locationType)

	if len(descBytes) > 0 {
		e.DescriptionJSON = json.RawMessage(append([]byte{}, descBytes...))
	}
	if len(attachmentBytes) > 0 {
		if err := json.Unmarshal(attachmentBytes, &e.Attachments); err != nil {
			return nil, fmt.Errorf("decode attachments: %w", err)
		}
	}
	if e.Attachments == nil {
		e.Attachments = []model.Attachment{}
	}
	return &e, nil
}

func nullableJSON(raw json.RawMessage) any {
	if len(raw) == 0 {
		return nil
	}
	return []byte(raw)
}

func nullableUUID(id *uuid.UUID) any {
	if id == nil {
		return nil
	}
	return *id
}

func marshalAttachments(a []model.Attachment) ([]byte, error) {
	if a == nil {
		return []byte("[]"), nil
	}
	return json.Marshal(a)
}
