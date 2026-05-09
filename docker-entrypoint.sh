#!/bin/sh
set -e

echo "Running database migrations..."
node scripts/migrate.mjs

echo "Starting blooshoo (SvelteKit)..."
exec node build/index.js
