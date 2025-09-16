# Architecture

## Overview

Carendar is two applications in one repository:

- **`apps/frontend`** — a Next.js 15 application with two surfaces: the
  public monthly calendar and the password-protected admin panel.
- **`apps/backend`** — a Go REST API that owns all event data in
  PostgreSQL, authenticates admins with short-lived JWTs, stores
  uploaded files in S3, and renders the public iCalendar feed.

The frontend never talks to the database. Every write path goes through
`/api/admin/*` with a Bearer token; every public read goes through
`/api/events/*` or `/api/calendar.ics`.

## Data model

```
events
  ├─ id (uuid, generated)
  ├─ parent_event_id → events(id)   recurrence instances point at their parent
  ├─ category (enum, 11 buckets)    drives the default color
  ├─ start/end_datetime (timestamptz)
  ├─ is_all_day
  ├─ description_json               TipTap document, rendered client-side
  ├─ attachments (jsonb)            {name, url, type, size}[]
  ├─ recurrence_rule (RRULE)        only ever set on the parent
  ├─ recurrence_end_date
  ├─ show_in_subscription           opt-in for the .ics feed
  └─ is_published                   drafts are admin-only
```

Recurring events are **materialised**: when a parent is created or
updated, the backend expands the RRULE (capped at 2 years or
`recurrence_end_date`) and inserts one concrete row per occurrence.
Children link back via `parent_event_id`; editing an instance is
rejected at the API layer — the admin edits the parent and children are
regenerated.

## Request flow

```
browser ──► Next.js (SSR + client) ──► Go API ──► Postgres
                     │                     │
                     │                     └──► S3 (uploads)
                     └── static assets (standalone server)
```

The admin flow adds a JWT: `POST /api/admin/auth` verifies the shared
password and mints an 8-hour token, which the frontend keeps in
`localStorage` and sends as `Authorization: Bearer …`. The same token is
also set as an httpOnly `mgm_admin_token` cookie for same-origin
deployments.

## Middleware chain

```
Recoverer → RequestID → SecurityHeaders → CORS → Logger → handler
```

`/api/admin/auth` additionally passes through a per-IP rate limiter
(10 attempts/minute) before reaching the login handler.
