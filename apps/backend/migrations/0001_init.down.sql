DROP TRIGGER IF EXISTS events_set_updated_at ON events;
DROP FUNCTION IF EXISTS set_updated_at();
DROP TABLE IF EXISTS seeds_log;
DROP TABLE IF EXISTS events;
DROP TYPE IF EXISTS location_kind;
DROP TYPE IF EXISTS event_category;
