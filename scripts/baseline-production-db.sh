#!/usr/bin/env bash
# One-time baseline for an existing Opervia production database that was created
# before Prisma Migrate was adopted (e.g. via db push or manual setup).
#
# Usage (with production DATABASE_URL):
#   DATABASE_URL="postgresql://..." npm run db:baseline:production
#
# This marks the initial migration as already applied, then runs migrate deploy
# to apply any newer migrations (e.g. add_user_totp) safely.
set -euo pipefail

echo "Baselining existing database with migration 20250522120000_init..."
npx prisma migrate resolve --applied 20250522120000_init

echo "Applying pending migrations..."
npx prisma migrate deploy

echo "Production database is baselined and up to date."
