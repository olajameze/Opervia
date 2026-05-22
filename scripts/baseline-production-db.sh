#!/usr/bin/env bash
# One-time baseline for an existing Opervia production database that was created
# before Prisma Migrate was adopted (e.g. via db push or manual setup).
#
# Usage (replace with your real Vercel Postgres connection string):
#   DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require" npm run db:baseline:production
#
# Get DATABASE_URL from: Vercel → Project → Settings → Environment Variables → Production
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Error: DATABASE_URL is not set."
  echo "Copy your Production DATABASE_URL from Vercel and run:"
  echo '  DATABASE_URL="postgresql://..." npm run db:baseline:production'
  exit 1
fi

if [[ ! "$DATABASE_URL" =~ ^postgres(ql)?:// ]]; then
  echo "Error: DATABASE_URL must start with postgresql:// or postgres://"
  echo "You passed: ${DATABASE_URL:0:40}..."
  echo ""
  echo "Do not use the placeholder from docs. Copy the real value from:"
  echo "  Vercel → opervia → Settings → Environment Variables → DATABASE_URL (Production)"
  exit 1
fi

if [[ "$DATABASE_URL" == *"your-vercel-production-database-url"* ]] \
  || [[ "$DATABASE_URL" == *"user:password@localhost"* ]]; then
  echo "Error: DATABASE_URL looks like a placeholder, not your production database."
  echo "Copy the real Production DATABASE_URL from Vercel before running this command."
  exit 1
fi

echo "Applying migrations (auto-baselines brownfield databases if needed)..."
bash scripts/migrate-deploy.sh

echo "Production database is baselined and up to date."
