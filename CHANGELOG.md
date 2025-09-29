# Changelog

All notable changes to Carendar are documented in this file. The project
follows [Semantic Versioning](https://semver.org/).

## [0.2.0] — 2025-09-09

### Added

- Admin event editor: TipTap rich text, S3 thumbnail + attachments,
  attendees, recurrence UI (daily/weekly/monthly/yearly with weekday
  picker), draft/publish workflow.
- Admin calendar with per-day drawer and hover `+ Tambah` affordances.
- Password login with JWT (8-hour TTL) + httpOnly cookie.

### Changed

- Category taxonomy replaced with the final MGM Lab business categories
  (11 buckets, each with its own default color).

## [0.1.0] — 2025-08-19

### Added

- Public monthly calendar grid (Monday-first weeks, WIB "today"
  highlight, chip overflow) with detail modal.
- Backend REST API: list/get events by month, admin CRUD, recurrence
  materialisation up to 2 years, S3 uploads.
- PostgreSQL schema with `set_updated_at` trigger and per-event colors.
