-- Reverse 0002. The category remap is lossy, so this restores the old enum
-- and folds the new buckets back onto the nearest legacy values.

CREATE TABLE IF NOT EXISTS seeds_log (
    id       SERIAL PRIMARY KEY,
    name     TEXT UNIQUE NOT NULL,
    ran_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP INDEX IF EXISTS events_subscription_idx;
ALTER TABLE events DROP COLUMN IF EXISTS show_in_subscription;

ALTER TYPE event_category RENAME TO event_category_new;

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

ALTER TABLE events
    ALTER COLUMN category TYPE event_category
    USING (
        CASE category::text
            WHEN 'internal_events'     THEN 'internal'
            WHEN 'external_events'     THEN 'internal'
            WHEN 'rnd_website'         THEN 'internal'
            WHEN 'rnd_game'            THEN 'internal'
            WHEN 'rnd_mobile'          THEN 'internal'
            WHEN 'rnd_ux'              THEN 'internal'
            WHEN 'major_events'        THEN 'big_event'
            WHEN 'workshop'            THEN 'seminar'
            WHEN 'project_development' THEN 'internal'
            WHEN 'academic_events'     THEN 'midterm'
            WHEN 'holiday'             THEN 'national_holiday'
            ELSE 'internal'
        END
    )::event_category;

DROP TYPE event_category_new;
