#!/bin/bash
# Deploy / update 30Nice Growth OS
# Chạy mỗi khi muốn cập nhật code mới lên VPS
# Usage: bash /var/www/30nice-growth-os/deploy/deploy.sh

set -e

APP_DIR="/var/www/30nice-growth-os"
APP_NAME="30nice-growth-os"   # PM2 app name (khớp với ecosystem.config.js)

echo "=== [1/5] Pull code mới ==="
cd "${APP_DIR}"
git pull origin main

echo "=== [2/5] Cài dependencies ==="
npm ci --omit=dev

echo "=== [3/5] Build Next.js ==="
npm run build

echo "=== [4/5] Chạy database migrations ==="
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss

echo "=== [5/5] Restart PM2 ==="
if pm2 list | grep -q "${APP_NAME}"; then
  pm2 reload "${APP_NAME}" --update-env
else
  pm2 start "${APP_DIR}/deploy/ecosystem.config.js"
fi
pm2 save

echo ""
echo "=== DEPLOY XONG ==="
pm2 status "${APP_NAME}"
