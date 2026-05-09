# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY svelte-app/package*.json ./
RUN npm ci

# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY svelte-app/ .

# Provide placeholder env vars so the build doesn't fail
ENV DATABASE_URL=postgresql://localhost/build-placeholder
ENV AUTH_SECRET=build-placeholder-secret-32-chars!!
ENV BETTER_AUTH_URL=http://localhost:3000
ENV BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000
ENV DISCORD_CLIENT_ID=placeholder
ENV DISCORD_CLIENT_SECRET=placeholder
ENV ALLOWED_DISCORD_IDS=placeholder
ENV BUNNYCDN_STORAGE_ZONE_NAME=placeholder
ENV BUNNYCDN_STORAGE_API_KEY=placeholder
ENV BUNNYCDN_PULL_ZONE_URL=https://placeholder.b-cdn.net
ENV BUNNYCDN_STORAGE_REGION=de
ENV DEEPSEEK_API_KEY=placeholder

RUN npm run build

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Runtime node_modules (only production deps)
COPY --from=deps    /app/node_modules ./node_modules
# SvelteKit build output
COPY --from=builder /app/build        ./build
# Config and runtime files
COPY svelte-app/package*.json        ./
COPY svelte-app/drizzle/             ./drizzle/
COPY svelte-app/scripts/migrate.mjs  ./scripts/migrate.mjs
COPY docker-entrypoint-svelte.sh     ./docker-entrypoint.sh
RUN sed -i 's/\r//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
