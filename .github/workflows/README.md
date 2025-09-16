# GitHub Actions — `carendar`

Three workflows ship in this monorepo. Both apps share the same
pipeline files; the deploy workflows build and publish **two** images
(`carendar-backend` and `carendar-frontend`).

| Workflow | Triggers | What it does |
|---|---|---|
| `ci.yml` | PRs · pushes to any branch · manual | Backend: `go vet` + `go build` + `go test -race`, plus a Docker build smoke. Frontend: `npm ci` + typecheck + production build, plus a Docker build smoke. No images are published. |
| `staging.yml` | Push to `staging` · PR to `staging` · manual | Builds and pushes both images to DockerHub with `staging` tags. |
| `production.yml` | Push to `main` · `v*` tags · manual | Builds and pushes both images to DockerHub with `latest` tags. |

`main` and `staging` still run `ci.yml` on push (the deploy workflows
only handle image publication, so the verification job is not
duplicated inside them).

## One-time setup

In **Settings → Secrets and variables → Actions**:

| Kind | Name | Value |
|---|---|---|
| Repository secret | `DOCKERHUB_USERNAME` | DockerHub account name. Images are pushed as `DOCKERHUB_USERNAME/carendar-backend` and `DOCKERHUB_USERNAME/carendar-frontend`. |
| Repository secret | `DOCKERHUB_TOKEN` | DockerHub access token (Account Settings → Security → New Access Token, Read & Write). |
| Repository variable | `STAGING_API_URL` | Backend URL the **staging** frontend bundle should call (baked at build time), e.g. `https://api-staging.mgm-lab.id`. |
| Repository variable | `PRODUCTION_API_URL` | Backend URL the **production** frontend bundle should call, e.g. `https://api.mgm-lab.id`. |
| Repository variable | `NEXT_PUBLIC_API_URL` | Fallback used by `ci.yml` when no environment-specific URL is set. |

If the credentials are missing, the deploy workflows skip their push
steps with a notice instead of failing — handy for forks.

Optional but recommended: define two **Environments** named `staging`
and `production` (Settings → Environments). The image jobs reference
them via `environment:`, which lets you add required reviewers,
restrict which branches can deploy, or scope the API-URL variables to
each environment.

## Image tags

| Trigger | Tags pushed |
|---|---|
| Push to `staging` | `staging`, `staging-<ts>`, `staging-<sha>` |
| Push to `main` | `latest`, `latest-<ts>`, `latest-<sha>` |

## Why `NEXT_PUBLIC_API_URL` is a build argument

Next.js inlines `NEXT_PUBLIC_*` variables into the client bundle at
build time. Changing the API endpoint requires rebuilding the image —
pointing one image at two endpoints isn't possible. That's why
`staging.yml` and `production.yml` each pass their own value through
`--build-arg`, and why two separate images are published.

## Local equivalents

```bash
# backend
cd apps/backend
go vet ./...
go build ./...
go test -race ./...
docker build -f apps/backend/Dockerfile .

# frontend
npm ci
npm run typecheck --workspace @carendar/frontend
npm run build --workspace @carendar/frontend
docker build -f apps/frontend/Dockerfile \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 .
```

## Releasing

```bash
# Promote staging → main via your normal PR flow first.
git checkout main && git pull
git tag v0.4.0
git push --tags
```

The `production.yml` workflow watches `v*` tags and publishes the
tagged build alongside `latest`.
