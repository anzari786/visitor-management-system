# ─────────────────────────────────────────────────────────────────────────────
# VMS API — Express + Prisma (MySQL)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Puppeteer is not used by the server — never pull the bundled Chromium.
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN corepack enable
WORKDIR /app

# ── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── Build (prisma client + tsc) ─────────────────────────────────────────────
FROM deps AS build
COPY . .
# prisma.config.ts resolves DATABASE_URL eagerly, so `prisma generate` needs the
# variable to exist even though it never connects. This placeholder stays in the
# build stage only — the runtime value comes from compose.
ENV DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"
RUN pnpm prisma generate && pnpm build

# ── Runtime ─────────────────────────────────────────────────────────────────
FROM base AS runner
ENV NODE_ENV=production

# Dev dependencies are kept so `prisma migrate deploy` can run on start-up.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# prisma/seed.ts imports from src/ (including the generated client), so the
# sources ride along to keep `pnpm prisma db seed` working in the container.
COPY --from=build /app/src ./src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml prisma.config.ts ./
COPY prisma ./prisma
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
