# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# ---- prod-deps ----
FROM node:22-alpine AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Provide placeholder env vars so the build doesn't fail
ENV DATABASE_URL=postgresql://localhost/build-placeholder
# Build-time placeholder so the postbuild module analysis doesn't fail.
# Never used at runtime: this stage's ENV does not propagate to the runner
# stage, and docker-compose requires a real AUTH_SECRET via ${AUTH_SECRET:?}.
ENV AUTH_SECRET=build-time-placeholder-not-used-at-runtime
ENV BETTER_AUTH_URL=http://localhost:3000
ENV BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000
ENV DISCORD_CLIENT_ID=placeholder
ENV DISCORD_CLIENT_SECRET=placeholder
ENV ALLOWED_DISCORD_IDS=placeholder
ENV BUNNY_CDN_URL=https://placeholder.b-cdn.net
ENV BUNNY_STORAGE_HOSTNAME=placeholder.b-cdn.net
ENV BUNNY_STORAGE_PASSWORD=placeholder
ENV BUNNY_STORAGE_ZONE=placeholder

RUN npm run build

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Runtime node_modules (only production deps)
COPY --from=prod-deps /app/node_modules ./node_modules
# SvelteKit build output
COPY --from=builder /app/build        ./build
# Config and runtime files
COPY package*.json        ./
COPY drizzle/             ./drizzle/
COPY scripts/migrate.mjs  ./scripts/migrate.mjs
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN sed -i 's/\r//' /app/docker-entrypoint.sh && chmod +x /app/docker-entrypoint.sh

# Drop root: the app never needs it at runtime.
USER node

EXPOSE 3000
ENTRYPOINT ["/app/docker-entrypoint.sh"]
