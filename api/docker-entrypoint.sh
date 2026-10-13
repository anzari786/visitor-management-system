#!/bin/sh
# Applies any pending migrations before the API starts. `migrate deploy` is
# idempotent, so restarts and scaled replicas are safe.
set -e

echo "→ Applying database migrations..."
pnpm prisma migrate deploy

echo "→ Starting API..."
exec "$@"
