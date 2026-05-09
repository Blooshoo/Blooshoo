#!/bin/sh
set -e

echo "Running database migrations..."
npm run db:migrate

if [ -n "$ADMIN_USERNAME" ]; then
  echo "Seeding admin user..."
  npm run seed
fi

echo "Starting blooshoo..."
exec npx next start -H 0.0.0.0 -p "${PORT:-3000}"
