# ---- deps: install all packages, compile native modules ----
FROM node:20-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- builder: next build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Stub DB for build-time generateStaticParams (produces an empty blog, fine)
ENV DATABASE_PATH=/tmp/build.db
ENV AUTH_SECRET=build-placeholder

# Apply schema so better-sqlite3 doesn't throw at import time during build
RUN npx drizzle-kit push && npm run build

# ---- runner: production image ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy pre-compiled node_modules (includes native better-sqlite3 binary)
COPY --from=deps    /app/node_modules ./node_modules
# Next.js build output
COPY --from=builder /app/.next        ./.next
COPY --from=builder /app/public       ./public
# Config and runtime files
COPY package*.json         ./
COPY drizzle/              ./drizzle/
COPY drizzle.config.ts     ./
COPY lib/                  ./lib/
COPY scripts/              ./scripts/
COPY docker-entrypoint.sh  ./
RUN chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
