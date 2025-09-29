# Carendar

A public event calendar with an integrated admin panel, built as a
single monorepo. The frontend is a Next.js 15 application styled after
the MGM Laboratory Design System; the backend is a Go (chi) REST API on
PostgreSQL with S3 file storage and iCalendar subscription feeds.

```
apps/
  backend/    Go REST API — events CRUD, JWT auth, S3 uploads, .ics feed
  frontend/   Next.js 15 — public calendar + admin event editor
.github/      CI/CD workflows, issue & PR templates
```

## Stack

| | Frontend | Backend |
|---|---|---|
| Language | TypeScript | Go 1.25 |
| Framework | Next.js 15 (App Router, standalone output) | [`go-chi/chi/v5`](https://github.com/go-chi/chi) |
| Database | — | PostgreSQL 13+ (16 in dev) via [`pgx/v5`](https://github.com/jackc/pgx) |
| Migrations | — | [`golang-migrate/migrate/v4`](https://github.com/golang-migrate/migrate) |
| Styles | Tailwind 3 + CSS-variable design tokens | — |
| Fonts | Bricolage Grotesque, Geist, Geist Mono (`next/font/google`) | — |
| Icons | `lucide-react` (stroke 2.25) | — |
| Rich text | TipTap v2 (StarterKit + Link, Image, YouTube, Placeholder, custom Audio node) | — |
| Auth | localStorage token + httpOnly cookie | Shared admin password + HS256 JWT (8 h TTL) |
| Files | — | AWS S3 (`aws-sdk-go-v2`) |
| Recurrence | UI builder → iCal RRULE | [`teambition/rrule-go`](https://github.com/teambition/rrule-go) expansion |

## Quick start

### Docker (full stack)

```bash
cp .env.example .env
# edit .env: at minimum set ADMIN_PASSWORD and JWT_SECRET. For uploads,
# fill in the AWS_* / S3 vars.
docker compose up --build

# frontend  → http://localhost:3000
# backend   → http://localhost:8080
# postgres  → localhost:5432
```

Migrations apply automatically on backend startup.

### Bare metal (development)

```bash
cp .env.example .env
docker compose up -d db            # or run your own Postgres

# terminal 1 — backend
cd apps/backend
export $(grep -v '^#' ../../.env | xargs)
export DATABASE_URL=postgres://mgm:mgm_dev_password@localhost:5432/mgm_calendar?sslmode=disable
go run ./cmd/server

# terminal 2 — frontend
npm ci
npm run dev                        # http://localhost:3000
```

## Environment variables

See [`.env.example`](.env.example) for the full annotated list. The
required ones:

| Var | Notes |
|---|---|
| `DATABASE_URL` | `postgres://user:pass@host:5432/db?sslmode=disable` |
| `ADMIN_PASSWORD` | Shared admin login. Change before deploying. |
| `JWT_SECRET` | At least 16 chars. Used to sign session tokens. |
| `NEXT_PUBLIC_API_URL` | Backend base URL the browser calls. Baked into the frontend bundle at build time. |

S3 vars are optional — if unset, `/api/admin/upload` returns
`503 uploads not configured` but the rest of the API works.

## API

### Public

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/healthz` | Liveness probe |
| `GET` | `/api/events?month=YYYY-MM` | Published events overlapping the month (defaults to current month) |
| `GET` | `/api/events/{id}` | Single published event |
| `GET` | `/api/calendar.ics?categories=a,b` | iCalendar feed of published, subscription-enabled events |

### Admin (JWT — `Authorization: Bearer <token>` or the `mgm_admin_token` cookie)

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/admin/auth` | `{"password": "…"}` → sets an httpOnly cookie + returns `{token, expires_at}` |
| `POST` | `/api/admin/logout` | Clears the cookie |
| `GET` | `/api/admin/me` | "Still authenticated" probe |
| `GET` | `/api/admin/events?month=YYYY-MM` | Includes drafts |
| `GET` | `/api/admin/events/{id}` | Includes drafts |
| `POST` | `/api/admin/events` | Create. Recurring parents materialise children up to 2 years out |
| `PUT` | `/api/admin/events/{id}` | Update. Children are wiped and regenerated. Instances can't be edited directly — edit the parent |
| `DELETE` | `/api/admin/events/{id}` | Delete (cascades to children) |
| `POST` | `/api/admin/upload` | `multipart/form-data`, `file=` (max 100 MiB) → `{url, name, type, size}` |

### Event payload (write)

```jsonc
{
  "title": "Rapat Koordinasi",
  "category": "internal_events",   // one of the 11 categories below
  "color": "#3a6dc5",              // optional; defaults from category
  "description_json": { "type": "doc", "content": [/* TipTap nodes */] },
  "thumbnail_url": "https://...",
  "start_datetime": "2026-05-18T09:00:00+07:00",
  "end_datetime":   "2026-05-18T10:30:00+07:00",
  "is_all_day": false,
  "location": "Lab A",
  "location_type": "physical",     // physical | online | hybrid
  "meeting_link": null,
  "dresscode": "Smart casual",
  "attendees": ["Idham", "Bu Rina"],
  "attachments": [
    { "name": "agenda.pdf", "url": "https://...", "type": "application/pdf", "size": 18432 }
  ],
  "recurrence_rule": "FREQ=WEEKLY;BYDAY=MO",  // iCal RRULE; null for non-recurring
  "recurrence_end_date": "2026-12-31",        // YYYY-MM-DD or null
  "show_in_subscription": true,
  "is_published": true
}
```

### Errors

Every error response is JSON with a single `error` field:

```jsonc
{ "error": "invalid category \"foo\"" }
```

Validation failures return `400`, auth failures `401`, missing
resources `404`, and rate-limited logins `429`.

## Admin panel

- **Login** — a real password login. `POST /api/admin/auth` sets an
  httpOnly `mgm_admin_token` cookie and returns the token; the frontend
  keeps it in `localStorage` and sends it as a Bearer header on every
  admin request. `AdminGuard` probes `/api/admin/me` on each `/admin/*`
  mount; a 401 bounces back to the login modal.
- **Admin calendar** — the same grid as the public view in an
  inverse-dark banner ("Mode Admin"), with a hover/focus `+ Tambah`
  affordance on every cell. Clicking a chip opens the admin popup with
  an **Edit** button; recurring instances bounce to their parent.
  Empty days go straight to `/admin/events/new?date=YYYY-MM-DD`; days
  with events open a right slide-in **Day Events Drawer**.
- **Event editor** — a two-column page (rich-text body / metadata
  sidebar): title, TipTap body with full toolbar, category, color
  (closed MGM palette only), thumbnail + attachments (S3), all-day
  toggle, start/end, location type + text, meeting link, dresscode,
  attendee chips, and a recurrence builder. A sticky bottom save bar
  offers **Simpan Draft**, **Publikasikan**, and inline-confirm
  **Hapus Event**.

### Recurrence → RRULE

| UI | Output |
|---|---|
| Tidak berulang | `recurrence_rule = null` |
| Setiap hari | `FREQ=DAILY` |
| Setiap minggu, Sen + Rab | `FREQ=WEEKLY;BYDAY=MO,WE` |
| Setiap bulan | `FREQ=MONTHLY` |
| Setiap tahun | `FREQ=YEARLY` |
| Berakhir: Pada tanggal | `recurrence_end_date = "YYYY-MM-DD"` (separate column) |
| Berakhir: Setelah N kali | appended as `;COUNT=N` |

Children are materialised on save (up to 2 years from the parent
start) and link back via `parent_event_id`.

### Timestamps

Editor date/time pickers are interpreted as **Asia/Jakarta (WIB)**
regardless of the admin's browser timezone, so "14:00 on 18 Mei 2026"
is stored as `2026-05-18T14:00:00+07:00` and round-trips to the same
wall-clock time on edit.
