-- 0002: replace the holiday/exam taxonomy with MGM Lab business categories,
-- add the calendar-subscription opt-in flag, and drop the holiday seeding log.

-- Swap the enum type. Existing rows are remapped onto the closest new bucket
-- so the migration is non-destructive even where data already exists.
ALTER TYPE event_category RENAME TO event_category_old;

CREATE TYPE event_category AS ENUM (
    'internal_events',
    'external_events',
    'rnd_website',
    'rnd_game',
    'rnd_mobile',
    'rnd_ux',
    'major_events',
    'workshop',
    'project_development',
    'academic_events',
    'holiday'
);

ALTER TABLE events
    ALTER COLUMN category TYPE event_category
    USING (
        CASE category::text
            WHEN 'internal'          THEN 'internal_events'
            WHEN 'big_event'         THEN 'major_events'
            WHEN 'seminar'           THEN 'workshop'
            WHEN 'midterm'           THEN 'academic_events'
            WHEN 'final'             THEN 'academic_events'
            WHEN 'national_holiday'  THEN 'holiday'
            WHEN 'religious_holiday' THEN 'holiday'
            WHEN 'joint_holiday'     THEN 'holiday'
            ELSE 'internal_events'
        END
    )::event_category;

DROP TYPE event_category_old;

ALTER TABLE events
    ADD COLUMN IF NOT EXISTS show_in_subscription BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS events_subscription_idx
    ON events (show_in_subscription);

-- Holiday auto-seeding is removed; admins now manage every event by hand.
DROP TABLE IF EXISTS seeds_log;
