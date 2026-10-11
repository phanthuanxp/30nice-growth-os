#!/bin/bash
# Deploy GFVGO to production from a clean git checkout.
#
# The ONLY supported way to change production. Never edit /var/www/gfvgo by hand:
# anything not committed to git is overwritten by the next deploy.
#
# Usage (on the VPS):
#   bash deploy/deploy.sh [git-ref]        # default ref: origin/main
#
# Flow: fetch ref into a clean build clone -> install, typecheck, test, build THERE
# (production keeps serving) -> backup prod + DB -> migrate -> sync the finished
# build into APP_DIR (runtime data untouched) -> reload PM2 -> smoke test.

set -euo pipefail

REF="${1:-origin/main}"
SRC_DIR="${SRC_DIR:-/srv/gfvgo-src}"
APP_DIR="${APP_DIR:-/var/www/gfvgo}"
APP_NAME="${APP_NAME:-gfvgo}"
APP_PORT="${APP_PORT:-3001}"
BACKUP_DIR="${BACKUP_DIR:-${APP_DIR}/.deploy-backups}"
KEEP_BACKUPS="${KEEP_BACKUPS:-10}"
REPO_URL="${REPO_URL:-https://github.com/phanthuanxp/30nice-growth-os.git}"
TS="$(date +%Y%m%d-%H%M%S)"

echo "=== [1/8] Fetch ${REF} into ${SRC_DIR} ==="
if [ ! -d "${SRC_DIR}/.git" ]; then
  git clone --quiet "${REPO_URL}" "${SRC_DIR}"
fi
cd "${SRC_DIR}"
if [ -n "$(git status --porcelain)" ]; then
  echo "ERROR: ${SRC_DIR} has local changes. It is a build-only clone; never edit it." >&2
  exit 1
fi
git fetch --quiet --prune origin
git checkout --quiet --detach "${REF}"
REVISION="$(git rev-parse HEAD)"
echo "Deploying ${REVISION}"

# Production env (DATABASE_URL, SESSION_SECRET, …) for migrate and build.
set -a
# shellcheck disable=SC1091
[ -f "${APP_DIR}/.env" ] && . "${APP_DIR}/.env"
# shellcheck disable=SC1091
[ -f "${APP_DIR}/.env.local" ] && . "${APP_DIR}/.env.local"
set +a
if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is not set in ${APP_DIR}/.env.local" >&2
  exit 1
fi

echo "=== [2/8] Install + verify + build in ${SRC_DIR} (production keeps serving) ==="
# Build/typecheck need devDependencies such as @types/* even when NODE_ENV=production.
npm ci --include=dev
npx prisma generate
npm run typecheck
npm test
npm run build

echo "=== [3/8] Backup production source + env ==="
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"
tar -C "${APP_DIR}" --exclude=node_modules --exclude=.next --exclude=.deploy-backups \
  -czf "${BACKUP_DIR}/source-pre-deploy-${TS}.tar.gz" .
chmod 600 "${BACKUP_DIR}/source-pre-deploy-${TS}.tar.gz"

echo "=== [4/8] Backup database ==="
pg_dump "${DATABASE_URL%%\?*}" > "${BACKUP_DIR}/db-pre-deploy-${TS}.sql"
chmod 600 "${BACKUP_DIR}/db-pre-deploy-${TS}.sql"

echo "=== [5/8] Migrate database ==="
npx prisma migrate deploy

echo "=== [6/8] Sync build into ${APP_DIR} ==="
# Runtime state lives in APP_DIR and must survive deploys.
rsync -a --delete \
  --exclude='.git/' \
  --exclude='.env*' \
  --exclude='.data/' \
  --exclude='.deploy-backups/' \
  --exclude='public/uploads/' \
  --exclude='.openclaw/' \
  --exclude='.claude/' \
  "${SRC_DIR}/" "${APP_DIR}/"
echo "${REVISION}" > "${APP_DIR}/REVISION"

echo "=== [7/8] Reload PM2 ==="
if pm2 describe "${APP_NAME}" >/dev/null 2>&1; then
  pm2 reload "${APP_NAME}" --update-env
else
  pm2 start "${APP_DIR}/deploy/ecosystem.config.js"
fi
pm2 save

echo "=== [8/8] Smoke test ==="
check() {
  local path="$1" host="$2" want="$3" got=""
  for _ in $(seq 1 15); do
    got="$(curl -s -o /dev/null -w '%{http_code}' -H "Host: ${host}" "http://127.0.0.1:${APP_PORT}${path}" || true)"
    [ "${got}" = "${want}" ] && { echo "OK   ${host}${path} -> ${got}"; return 0; }
    sleep 2
  done
  echo "FAIL ${host}${path} -> ${got} (want ${want})" >&2
  return 1
}
check / gfvgo.com 200
check /login gfvgo.com 200
check /api/internal/redirects gfvgo.com 404

# Keep the newest KEEP_BACKUPS of each backup kind.
for kind in source-pre-deploy db-pre-deploy; do
  ls -1t "${BACKUP_DIR}/${kind}-"* 2>/dev/null | tail -n +"$((KEEP_BACKUPS + 1))" | xargs -r rm -f
done

echo ""
echo "=== DEPLOY DONE: ${REVISION} ==="
echo "Rollback: bash ${SRC_DIR}/deploy/deploy.sh <previous-commit>   (DB dump: ${BACKUP_DIR}/db-pre-deploy-${TS}.sql)"
