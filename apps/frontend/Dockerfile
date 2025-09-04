# syntax=docker/dockerfile:1.6

# Built from the repository root so npm workspaces resolve correctly:
#   docker build -f apps/frontend/Dockerfile \
#     --build-arg NEXT_PUBLIC_API_URL=http://localhost:8080 .

# ── Dependencies ───────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
RUN npm ci --no-audit --no-fund

# ── Build ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build --workspace @carendar/frontend

# ── Runtime ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
# Next preserves the workspace path inside the standalone output, hence
# the doubled apps/frontend segment. The traced node_modules lives one
# level up (the standalone root), so it is copied separately.
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone/apps/frontend/ ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/standalone/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/apps/frontend/.next/static ./.next/static
USER nextjs
EXPOSE 3000
ENV PORT=3000 HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
