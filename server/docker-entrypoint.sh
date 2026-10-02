#!/bin/sh
set -e

echo "==> Running Prisma migrations..."
npx prisma migrate deploy

if [ "$RUN_SEED" = "true" ]; then
  echo "==> Running database seed..."
  npx tsx prisma/seed.ts || echo "Seed execution completed."
fi

echo "==> Starting server..."
exec "$@"
