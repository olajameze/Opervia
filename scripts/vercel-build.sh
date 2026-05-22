#!/usr/bin/env bash
set -euo pipefail

npx prisma generate
bash scripts/migrate-deploy.sh
npx next build
