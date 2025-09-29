# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Report
them privately to **security@shirasaka.ren** with:

- a description of the issue
- steps to reproduce, if possible
- affected versions

You should receive an initial response within 3 working days. We ask
that you give us up to 90 days before disclosing the issue publicly.

## Supported versions

| Version | Supported          |
| ------- | ------------------ |
| 0.4.x   | :white_check_mark: |
| 0.3.x   | :white_check_mark: |
| < 0.3.0 | :x:                |

## What we consider in scope

- The Go API (`apps/backend`) — auth, input validation, SQL, file
  uploads.
- The Next.js frontend (`apps/frontend`) — XSS via TipTap JSON, URL
  sanitisation, admin session handling.
- CI/CD workflows and the published Docker images.

## What we don't consider in scope

- Denial of service through intentionally pathological RRULEs or upload
  payloads within the documented limits.
- Issues requiring physical access to the deployment machine.
