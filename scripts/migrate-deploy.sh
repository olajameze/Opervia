#!/usr/bin/env bash
# Applies Prisma migrations in production. Auto-baselines brownfield databases
# that were created before Migrate (e.g. via db push) when deploy returns P3005.
set -euo pipefail

INIT_MIGRATION="20250522120000_init"
MAX_ATTEMPTS="${PRISMA_MIGRATE_MAX_ATTEMPTS:-3}"
export PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT="${PRISMA_MIGRATE_ADVISORY_LOCK_TIMEOUT:-120000}"

# Preview deployments often share a database with production; skip to avoid lock races.
if [[ -n "${VERCEL:-}" && "${VERCEL_ENV:-}" != "production" ]]; then
  echo "Skipping migrations on Vercel ${VERCEL_ENV:-unknown} deployment."
  exit 0
fi

resolve_direct_url() {
  if [[ -n "${DIRECT_URL:-}" ]]; then
    printf '%s' "$DIRECT_URL"
    return
  fi
  if [[ -n "${DATABASE_URL_UNPOOLED:-}" ]]; then
    printf '%s' "$DATABASE_URL_UNPOOLED"
    return
  fi
  if [[ -n "${POSTGRES_URL_NON_POOLING:-}" ]]; then
    printf '%s' "$POSTGRES_URL_NON_POOLING"
    return
  fi
}

configure_migration_database_urls() {
  local direct_url
  direct_url="$(resolve_direct_url || true)"

  if [[ -n "$direct_url" ]]; then
    export DIRECT_URL="$direct_url"
    echo "Using direct database URL for migrations (non-pooled)."
    return
  fi

  if [[ "${DATABASE_URL:-}" == *"-pooler."* ]]; then
    echo "Error: DATABASE_URL uses a pooled Neon/Vercel Postgres host."
    echo "Set DIRECT_URL (or use the Neon integration's DATABASE_URL_UNPOOLED) for migrations."
    exit 1
  fi

  echo "Warning: DIRECT_URL is not set; falling back to DATABASE_URL for migrations."
}

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

is_up_to_date() {
  grep -qE 'Database schema is up to date|No pending migrations to apply' <<<"$1"
}

run_migrate_status() {
  npx prisma migrate status 2>&1
}

run_migrate_deploy() {
  npx prisma migrate deploy 2>&1
}

deploy_migrations() {
  local output
  local exit_code
  local attempt=1

  configure_migration_database_urls

  set +e
  output="$(run_migrate_status)"
  exit_code=$?
  set -e

  echo "$output"

  if [[ $exit_code -eq 0 ]] && is_up_to_date "$output"; then
    echo "Skipping migrate deploy — database is already up to date."
    return 0
  fi

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

    if is_up_to_date "$output"; then
      return 0
    fi

    if is_advisory_lock_error "$output" && [[ $attempt -lt $MAX_ATTEMPTS ]]; then
      echo "Migration advisory lock timeout (attempt ${attempt}/${MAX_ATTEMPTS}). Retrying in 20s..."
      sleep 20
      attempt=$((attempt + 1))
      continue
    fi

    return "$exit_code"
  done

  return 1
}

deploy_migrations
