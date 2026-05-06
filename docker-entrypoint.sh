#!/bin/sh
set -e

DB_DIR=$(dirname "$DATABASE_PATH")
mkdir -p "$DB_DIR"

echo "Running database migrations..."
npx drizzle-kit push

if [ -n "$ADMIN_USERNAME" ]; then
  echo "Seeding admin user..."
  npm run seed
fi

echo "Starting blooshoo..."
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
