# ─────────────────────────────────────────────────────────────
#  DimovTax — Multi-stage Dockerfile
#  Stages: base → deps → builder → runner (final image)
# ─────────────────────────────────────────────────────────────

# ── Base: shared system deps ──────────────────────────────────
FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PNPM_CONFIG_MINIMUM_RELEASE_AGE=0
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable

# ── Deps: install node_modules (cached layer) ────────────────
FROM base AS deps

WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ── Builder: compile Next.js + generate Prisma client ─────────
FROM base AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN ./node_modules/.bin/prisma generate
RUN pnpm build

# ── Seeder: full deps for running the seed script ─────────────
# Used only by `make seed` (compose profile); not part of the app image.
FROM base AS seeder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/.next/standalone ./
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && ./node_modules/.bin/tsx prisma/seed.ts"]

# ── Runner: minimal production image ──────────────────────────
FROM base AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Standalone server (bundles only the node_modules the app needs)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma schema + migrations + generated client (for migrate deploy at startup)
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nextjs:nodejs /app/src/generated ./src/generated

# Prisma CLI only (for running migrations at startup)
RUN mkdir -p /opt/prisma && cd /opt/prisma && npm init -y > /dev/null 2>&1 \
    && npm install prisma@7.8.0 \
    && chown -R nextjs:nodejs /opt/prisma
ENV NODE_PATH="/opt/prisma/node_modules"
ENV PATH="/opt/prisma/node_modules/.bin:$PATH"

RUN mkdir -p .next && chown nextjs:nodejs .next

USER nextjs

EXPOSE 3000

# Apply pending migrations, then start the server
CMD ["sh", "-c", "prisma migrate deploy && node server.js"]
