#!/usr/bin/env bash
# Applies Prisma migrations in production. Auto-baselines brownfield databases
# that were created before Migrate (e.g. via db push) when deploy returns P3005.
set -euo pipefail

INIT_MIGRATION="20250522120000_init"
MAX_ATTEMPTS="${PRISMA_MIGRATE_MAX_ATTEMPTS:-3}"
export PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT="${PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT:-60000}"

# Preview deployments often share a database with production; skip to avoid lock races.
if [[ -n "${VERCEL:-}" && "${VERCEL_ENV:-}" != "production" ]]; then
  echo "Skipping migrations on Vercel ${VERCEL_ENV:-unknown} deployment."
  exit 0
fi

if [[ -z "${DIRECT_URL:-}" ]]; then
  echo "Warning: DIRECT_URL is not set. Migrations use DATABASE_URL."
  echo "If you use Neon, Supabase, or Vercel Postgres pooling, set DIRECT_URL to the non-pooled connection string."
else
  echo "Using DIRECT_URL for migrations (Prisma directUrl)."
fi

baseline_init_migration() {
  echo "Brownfield database detected — marking ${INIT_MIGRATION} as applied..."
  npx prisma migrate resolve --applied "$INIT_MIGRATION"
}

is_brownfield_migration_error() {
  grep -qE 'P3005|The database schema is not empty|relation .+ already exists' <<<"$1"
}

is_advisory_lock_error() {
  grep -qE 'P1002|advisory lock|advisory_lock' <<<"$1"
}

run_migrate_deploy() {
  npx prisma migrate deploy 2>&1
}

deploy_migrations() {
  local output
  local exit_code
  local attempt=1

  while [[ $attempt -le $MAX_ATTEMPTS ]]; do
    set +e
    output="$(run_migrate_deploy)"
    exit_code=$?
    set -e

    echo "$output"

    if [[ $exit_code -eq 0 ]]; then
      return 0
    fi

    if is_brownfield_migration_error "$output"; then
      baseline_init_migration
      output="$(run_migrate_deploy)"
      exit_code=$?
      echo "$output"
      return "$exit_code"
    fi

    if is_advisory_lock_error "$output" && [[ $attempt -lt $MAX_ATTEMPTS ]]; then
      echo "Migration advisory lock timeout (attempt ${attempt}/${MAX_ATTEMPTS}). Retrying in 15s..."
      sleep 15
      attempt=$((attempt + 1))
      continue
    fi

    return "$exit_code"
  done

  return 1
}

deploy_migrations
