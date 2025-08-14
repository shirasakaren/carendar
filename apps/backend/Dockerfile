# syntax=docker/dockerfile:1.6

# ── Build stage ────────────────────────────────────────────────────────
FROM golang:1.25-alpine AS build
WORKDIR /src

RUN apk add --no-cache git ca-certificates

# Resolve and cache modules before copying the rest of the source.
COPY go.mod ./
COPY go.sum* ./
RUN go mod download || true

COPY . .
# tidy so missing/extra deps are reconciled before build.
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/server ./cmd/server

# ── Runtime stage ──────────────────────────────────────────────────────
FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app
COPY --from=build /out/server /app/server
COPY --from=build /src/migrations /app/migrations
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["/app/server"]
