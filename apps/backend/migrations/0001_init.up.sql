-- MGM Laboratory Event Calendar — initial schema
-- Requires PostgreSQL 13+ for built-in gen_random_uuid().

DO $$ BEGIN
    CREATE TYPE event_category AS ENUM (
        'national_holiday',
        'religious_holiday',
        'joint_holiday',
        'internal',
        'big_event',
        'midterm',
        'final',
        'seminar'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE location_kind AS ENUM ('physical', 'online', 'hybrid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS events (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_event_id     UUID REFERENCES events(id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    category            event_category NOT NULL,
    color               TEXT NOT NULL DEFAULT '#3a6dc5',
    description_json    JSONB,
    thumbnail_url       TEXT,
    start_datetime      TIMESTAMPTZ NOT NULL,
    end_datetime        TIMESTAMPTZ NOT NULL,
    is_all_day          BOOLEAN NOT NULL DEFAULT FALSE,
    location            TEXT,
    location_type       location_kind NOT NULL DEFAULT 'physical',
    meeting_link        TEXT,
    dresscode           TEXT,
    attendees           TEXT[],
    attachments         JSONB NOT NULL DEFAULT '[]'::jsonb,
    recurrence_rule     TEXT,
    recurrence_end_date DATE,
    is_seeded           BOOLEAN NOT NULL DEFAULT FALSE,
    is_published        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_start_idx       ON events (start_datetime);
CREATE INDEX IF NOT EXISTS events_end_idx         ON events (end_datetime);
CREATE INDEX IF NOT EXISTS events_parent_idx      ON events (parent_event_id);
CREATE INDEX IF NOT EXISTS events_published_idx   ON events (is_published);
CREATE INDEX IF NOT EXISTS events_category_idx    ON events (category);

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS events_set_updated_at ON events;
CREATE TRIGGER events_set_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS seeds_log (
    id       SERIAL PRIMARY KEY,
    name     TEXT UNIQUE NOT NULL,
    ran_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
