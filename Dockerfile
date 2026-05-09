# ---- deps: install all packages ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- builder: next build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://localhost/build-placeholder
ENV AUTH_SECRET=build-placeholder-secret-32-chars!!
# better-auth needs a base URL during build
ENV BETTER_AUTH_URL=http://localhost:3000

RUN npm run build

# ---- runner: production image ----
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy pre-compiled node_modules
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
RUN sed -i 's/\r//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
