#!/usr/bin/env bash
# Applies Prisma migrations in production. Auto-baselines brownfield databases
# that were created before Migrate (e.g. via db push) when deploy returns P3005.
set -euo pipefail

INIT_MIGRATION="20250522120000_init"

baseline_init_migration() {
  echo "Brownfield database detected — marking ${INIT_MIGRATION} as applied..."
  npx prisma migrate resolve --applied "$INIT_MIGRATION"
}

is_brownfield_migration_error() {
  grep -qE 'P3005|The database schema is not empty|relation .+ already exists' <<<"$1"
}

deploy_migrations() {
  local output
  local exit_code

  set +e
  output="$(npx prisma migrate deploy 2>&1)"
  exit_code=$?
  set -e

  echo "$output"

  if [[ $exit_code -eq 0 ]]; then
    return 0
  fi

  if is_brownfield_migration_error "$output"; then
    baseline_init_migration
    npx prisma migrate deploy
    return 0
  fi

  return "$exit_code"
}

deploy_migrations
