# System Architecture & Technical Specifications - Neostatic

---

## 1. Tech Stack Overview

- **Frontend**: React 19 (Vite), Tailwind CSS, Lucide React (Icons).
- **Backend / Runtime**: Rust (Axum, Tokio, Zip crate, Tower-HTTP).
- **Web Server / Reverse Proxy**: Nginx (Sudah terpasang di VPS `neoproject.my.id`).
- **File Storage & Deployment**:
  - Rilis Fisik: `/var/www/releases/<slug>/<timestamp>/`
  - Symlink Aktif: `/var/www/staticpage/<slug>` -> `/var/www/releases/<slug>/<timestamp>`
- **Packaging / Delivery**: Single Binary Executable Rust (menyajikan API & UI Dashboard).

---

## 2. Struktur Direktori Proyek Monorepo

```text
neostatic/
├── backend/                  # Rust API Service & Security Validator
│   ├── src/
│   │   ├── main.rs           # Entry point Axum & routing
│   │   ├── config.rs         # Konfigurasi port, path storage, secret token
│   │   ├── security.rs       # Zip Slip guard, extension allowlist, zip bomb guard
│   │   ├── deployer.rs       # Atomic release extraction & symlink switching
│   │   └── handlers.rs       # Handler upload, sites list, delete site
│   └── Cargo.toml
├── frontend/                 # React Dashboard (Vite + Tailwind)
│   ├── src/
│   │   ├── components/       # Dropzone, ProjectList, VerificationBadge
│   │   ├── App.jsx           # UI Dashboard utama
│   │   └── main.jsx
│   └── package.json
├── nginx/
│   └── neoproject.conf       # Snippet konfigurasi Nginx untuk neoproject.my.id
└── docs/
    └── context/              # Living Context System
```

---

## 3. Diagram Alur Deployment (Atomic Data Flow)

```
[Browser / User] 
       │  (Upload ZIP + Slug + Token)
       ▼
[Nginx Reverse Proxy (/deploy-manager/api/deploy)]
       │
       ▼
[Rust Axum Server]
       │
       ├── Step 1: Validasi Slug (Regex: ^[a-zA-Z0-9_-]+$)
       ├── Step 2: Inspeksi Keamanan File ZIP (In-Memory / Temp)
       │    ├── Enclosed Name Check (Anti Zip-Slip)
       │    ├── Extension Allowlist Check (.html, .css, .js, assets)
       │    ├── Root index.html Existence Check
       │    └── Zip Bomb Check (Max 100MB, Max 2000 files)
       │
       ├── Step 3: Ekstraksi ke /var/www/releases/<slug>/<timestamp>/
       │
       └── Step 4: Atomic Symlink Switch
            ln -sfn /var/www/releases/<slug>/<timestamp> /var/www/staticpage/<slug>
       │
       ▼
[Nginx Static Engine] ──► Melayani https://neoproject.my.id/staticpage/<slug>/
```
