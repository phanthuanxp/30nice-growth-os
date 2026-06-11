#!/bin/bash
# First-time VPS setup for 30Nice Growth OS
# Run as root on the VPS: bash setup.sh
# VPS: 5.189.185.36  |  App domain: admin.30nice.vn

set -e

APP_DIR="/var/www/30nice-growth-os"
APP_PORT=3001
DB_NAME="growth_os_db"
DB_USER="growth_os"
GITHUB_REPO="https://github.com/YOUR_USERNAME/30nice-growth-os.git"   # <-- đổi lại

echo "=== [1/6] Cài Node.js 20 LTS ==="
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

echo "=== [2/6] Cài PM2 ==="
npm install -g pm2 2>/dev/null
pm2 --version

echo "=== [3/6] Tạo PostgreSQL database ==="
# Kiểm tra PostgreSQL đang chạy
systemctl is-active --quiet postgresql || { echo "PostgreSQL không chạy!"; exit 1; }

# Tạo user + database (bỏ qua nếu đã tồn tại)
DB_PASS=$(openssl rand -base64 24)
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

echo ""
echo ">>> DATABASE_URL mới:"
echo "    postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}"
echo ">>> Lưu lại URL này để điền vào file .env!"
echo ""

echo "=== [4/6] Clone repository ==="
mkdir -p "${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  echo "Repo đã tồn tại, bỏ qua clone."
else
  git clone "${GITHUB_REPO}" "${APP_DIR}"
fi

echo "=== [5/6] Cài dependencies ==="
cd "${APP_DIR}"
npm ci --omit=dev

echo "=== [6/6] Cấu hình PM2 startup ==="
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

echo ""
echo "=== HOÀN THÀNH SETUP ==="
echo ""
echo "Bước tiếp theo:"
echo "  1. Tạo file .env:"
echo "       cp ${APP_DIR}/deploy/env.production.example ${APP_DIR}/.env"
echo "       nano ${APP_DIR}/.env    # điền DATABASE_URL ở trên"
echo ""
echo "  2. Build và khởi động app:"
echo "       bash ${APP_DIR}/deploy/deploy.sh"
echo ""
echo "  3. Cài Nginx config:"
echo "       cp ${APP_DIR}/deploy/nginx-admin.30nice.vn.conf /etc/nginx/sites-available/admin.30nice.vn"
echo "       ln -sf /etc/nginx/sites-available/admin.30nice.vn /etc/nginx/sites-enabled/"
echo "       nginx -t && systemctl reload nginx"
echo ""
echo "  4. Cài SSL:"
echo "       certbot --nginx -d admin.30nice.vn"
echo ""
echo "  5. Trỏ DNS: admin.30nice.vn A 5.189.185.36"
