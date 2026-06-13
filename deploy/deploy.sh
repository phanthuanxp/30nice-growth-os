#!/bin/bash
# Safe deploy / update 30Nice Growth OS
# Usage from the app directory:
#   bash deploy/deploy.sh
#
# This project is currently deployed directly at /var/www/30nice-growth-os.
# Do not assume the production directory is a git repository.

set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/30nice-growth-os}"
APP_NAME="${APP_NAME:-30nice-growth-os}"
BACKUP_DIR="${BACKUP_DIR:-${APP_DIR}/.deploy-backups}"
TS="$(date +%Y%m%d-%H%M%S)"

cd "${APP_DIR}"
mkdir -p "${BACKUP_DIR}"

echo "=== [0/6] Sanity checks ==="
if [ ! -f package.json ] || [ ! -f next.config.ts ]; then
  echo "ERROR: ${APP_DIR} does not look like the 30Nice Growth OS app directory." >&2
  exit 1
fi

if [ -f .env ]; then
  # shellcheck disable=SC2046
  export $(grep -E '^[A-Za-z_][A-Za-z0-9_]*=' .env | sed 's/#.*//' | xargs) || true
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "WARN: DATABASE_URL is not set. DB backup and migration status checks will be skipped."
fi

echo "=== [1/6] Backup source/env ==="
tar --exclude=node_modules --exclude=.next --exclude=.git --exclude=.deploy-backups \
  -czf "${BACKUP_DIR}/source-pre-deploy-${TS}.tar.gz" .
cp -a .env "${BACKUP_DIR}/.env.pre-deploy-${TS}" 2>/dev/null || true
chmod 600 "${BACKUP_DIR}/.env.pre-deploy-${TS}" 2>/dev/null || true

echo "=== [2/6] Backup database ==="
if [ -n "${DATABASE_URL:-}" ]; then
  pg_dump "${DATABASE_URL}" > "${BACKUP_DIR}/db-pre-deploy-${TS}.sql"
  chmod 600 "${BACKUP_DIR}/db-pre-deploy-${TS}.sql"
else
  echo "Skipped DB backup because DATABASE_URL is missing."
fi

echo "=== [3/6] Install dependencies ==="
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi

echo "=== [4/6] Prisma generate / migrations ==="
npx prisma generate
if [ -d prisma/migrations ] && find prisma/migrations -mindepth 1 -maxdepth 1 -type d | grep -q .; then
  npx prisma migrate deploy
else
  echo "No Prisma migrations found; skipping schema push."
  echo "IMPORTANT: this script intentionally does NOT run 'prisma db push --accept-data-loss'."
fi

echo "=== [5/6] Build ==="
npm run typecheck
npm run build

echo "=== [6/6] Restart PM2 ==="
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 reload "${APP_NAME}" --update-env
else
  pm2 start "${APP_DIR}/deploy/ecosystem.config.js"
fi
pm2 save

echo ""
echo "=== DEPLOY DONE ==="
echo "Backups: ${BACKUP_DIR}"
pm2 status "${APP_NAME}"
