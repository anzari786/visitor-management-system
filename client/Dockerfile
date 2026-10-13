# ─────────────────────────────────────────────────────────────────────────────
# VMS Client — Next.js (standalone output)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# ── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── Dev server ──────────────────────────────────────────────────────────────
# Used by docker compose. `next dev` reads NEXT_PUBLIC_* at runtime, which is
# what makes the DEV_BYPASS_AUTH flags usable without rebuilding the image.
FROM base AS dev
ENV NODE_ENV=development
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
COPY --from=deps /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
# Invoke next directly: `pnpm dev` runs a deps-status check that aborts without
# a TTY when the runtime pnpm differs from the one that built node_modules.
CMD ["./node_modules/.bin/next", "dev"]

# ── Build ───────────────────────────────────────────────────────────────────
FROM base AS build
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time, so
# this is a build arg — the browser reaches the API from the host, not from
# inside the compose network.
ARG NEXT_PUBLIC_API_URL=http://localhost:5000/api
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ── Runtime ─────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
