#!/bin/bash
# Neostatic VPS Setup & Build Script
set -e

echo "=== Membangun Neostatic (Single-Binary System) ==="

# 1. Build React Frontend
echo "--> Membangun Frontend React..."
cd frontend
npm install
npm run build
cd ..

# 2. Build Rust Backend Single Binary
echo "--> Membangun Binary Rust Release..."
cd backend
cargo build --release
cd ..

echo "--> Menyiapkan direktori server /var/www..."
sudo mkdir -p /var/www/staticpage
sudo mkdir -p /var/www/releases
sudo chown -R www-data:www-data /var/www/staticpage /var/www/releases

echo "--> Menyalin binary ke /usr/local/bin..."
sudo cp backend/target/release/neostatic-backend /usr/local/bin/neostatic
sudo chmod +x /usr/local/bin/neostatic

# 3. Setup systemd service jika belum ada
if [ ! -f /etc/systemd/system/neostatic.service ]; then
  echo "--> Memasang systemd service..."
  sudo bash -c 'cat > /etc/systemd/system/neostatic.service <<EOF
[Unit]
Description=Neostatic Deployment Engine & Dashboard
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www
Environment=PORT=8080
Environment=BIND_HOST=127.0.0.1
Environment=BASE_STATIC_DIR=/var/www/staticpage
Environment=BASE_RELEASE_DIR=/var/www/releases
Environment=PUBLIC_URL_PREFIX=https://neoproject.my.id/staticpage
ExecStart=/usr/local/bin/neostatic
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF'

  sudo systemctl daemon-reload
  sudo systemctl enable neostatic
fi

echo "--> Me-restart service Neostatic..."
sudo systemctl restart neostatic
sudo systemctl status neostatic --no-pager

echo "=== Selesai! Neostatic aktif di http://127.0.0.1:8080 ==="
echo "Konfigurasi Nginx tersedia di nginx/neoproject.conf"

