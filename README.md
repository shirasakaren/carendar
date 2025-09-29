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
