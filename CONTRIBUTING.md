# Contributing to Carendar

Thanks for helping out! This file covers the basics of working in the
monorepo.

## Repo layout

```
apps/
  backend/    Go (chi) REST API — Postgres, JWT auth, S3 uploads
  frontend/   Next.js 15 app — public calendar + admin panel
.github/      CI/CD workflows, issue & PR templates
```

The root `package.json` is an npm-workspaces root; the frontend is the
only workspace. All Go tooling runs from `apps/backend`.

## Getting started

```bash
cp .env.example .env

# Easiest: the full stack in Docker
docker compose up --build          # http://localhost:3000

# Or bare metal
docker compose up -d db
npm ci
npm run dev                        # terminal 1
cd apps/backend && go run ./cmd/server   # terminal 2
```

## Before you open a PR

```bash
make vet test                      # backend checks
make typecheck                     # frontend check
make build                         # frontend production build
docker compose build               # image builds
```

## Commit conventions

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new behaviour
- `fix:` bug fixes
- `refactor:` behaviour-preserving changes
- `test:` tests only
- `docs:` documentation
- `ci:` workflows and tooling
- `chore:` everything else

Scopes are optional but encouraged: `feat(backend): …`,
`fix(calendar): …`.

## Pull requests

- Open an issue first for anything non-trivial so the design can be
  discussed.
- Reference the issue from the PR (`Closes #123`).
- Keep frontend and backend changes in separate PRs unless they are
  two halves of one feature — then call it out in the description.

## Tests

- Backend: `go test -race ./...` in `apps/backend`. Add a test for any
  pure function you change (RFC 5545 escaping, recurrence expansion,
  validation…).
- Frontend: we currently rely on `tsc` and manual review. If a PR is
  complex, describe your manual test plan in the PR body.

## Release checklist

1. Promote `staging` → `main` through a normal PR.
2. Update `CHANGELOG.md` and bump the version in `package.json`.
3. Tag the release: `git tag -a vX.Y.Z -m "Carendar vX.Y.Z — …"`.
4. `git push --tags` — the production workflow picks up `v*` tags and
   publishes both images.
5. Verify the tag on the releases page and that CI is green.
