# Deployment & Infrastructure Context - Neostatic

---

## 1. Lingkungan & Server Target

- **Domain Utama**: `neoproject.my.id`
- **Sajian Halaman Statis**: `https://neoproject.my.id/staticpage/<slug>/`
- **Dashboard Manajer**: `https://neoproject.my.id/deploy-manager/`
- **OS Target**: Linux VPS (Ubuntu/Debian) dengan Nginx dan Systemd.

---

## 2. Struktur Direktori di VPS

```bash
# Direktori Rilis Fisik
/var/www/releases/<slug>/<timestamp>/

# Direktori Symlink yang Dibaca Nginx
/var/www/staticpage/<slug> -> /var/www/releases/<slug>/<timestamp>

# Lokasi Binary Service Neostatic
/usr/local/bin/neostatic
/etc/neostatic/neostatic.env
```

---

## 3. Konfigurasi Nginx (`/etc/nginx/sites-available/neoproject.my.id`)

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name neoproject.my.id;

    # 1. Penyajian File Statis Halaman
    location /staticpage/ {
        root /var/www;
        index index.html;
        autoindex off;

        # Proteksi tolak file eksekusi
        location ~* \.(php|sh|py|cgi|env|git|htaccess)$ {
            deny all;
            return 404;
        }

        try_files $uri $uri/ =404;
    }

    # 2. Reverse Proxy ke Dashboard & API Neostatic
    location /deploy-manager/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50M;
    }
}
```

---

## 4. Konfigurasi Systemd Service (`/etc/systemd/system/neostatic.service`)

```ini
[Unit]
Description=Neostatic Deployment Engine & Dashboard
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www
EnvironmentFile=/etc/neostatic/neostatic.env
ExecStart=/usr/local/bin/neostatic
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## 5. Environment Variables (`/etc/neostatic/neostatic.env`)

```bash
PORT=8080
BIND_ADDR=127.0.0.1
BASE_STATIC_DIR=/var/www/staticpage
BASE_RELEASE_DIR=/var/www/releases
PUBLIC_URL_PREFIX=https://neoproject.my.id/staticpage
ADMIN_TOKEN=ganti-dengan-token-rahasia-anda
MAX_UPLOAD_SIZE_MB=50
```
