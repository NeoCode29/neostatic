# Feature Context: Rust Backend Security Validator & API Upload

> Dokumen spesifikasi fitur tingkat modul (Single Source of Truth) berbasis **TELOS Intent Alignment**.

---

## 1. Ikhtisar Fitur & TELOS Intent

- **Nama Modul**: Static Deployment Security Validator & API Service (Rust)
- **Target Pengguna / Peran**: Developer / Admin VPS (neoproject.my.id)
- **Current State (Kondisi Saat Ini)**:
  - Project `neostatic/backend` baru diinisialisasi Cargo dasar tanpa handler upload, verifikasi keamanan, atau manajemen atomic release.
- **Ideal State (Kondisi Sukses)**:
  - Layanan Rust Axum dapat menerima upload arsip `.zip` via multipart form.
  - Menginspeksi keamanan secara ketat (anti zip-slip/path traversal, allowlist ekstensi aman, batas ukuran file & jumlah file).
  - Mengekstrak file secara atomic ke folder rilis `/var/www/releases/<slug>/<timestamp>` dan membuat symlink ke `/var/www/staticpage/<slug>`.
  - Mengembalikan respons JSON dengan detail status keamanan dan URL publik halaman (`https://neoproject.my.id/staticpage/<slug>/`).

---

## 2. Kebutuhan Fungsional & Kriteria Pembuktian (Falsifiable Verification)

- [ ] **Kriteria 1 (Slug Validation)**: Slug nama halaman hanya boleh berisi `[a-zA-Z0-9_-]`. Karakter spesial, spasi, atau path traversal (`..`, `/`, `\`) ditolak dengan HTTP 400.
- [ ] **Kriteria 2 (Zip Slip & Path Traversal Guard)**: Setiap entry dalam ZIP harus divalidasi dengan `enclosed_name()`. Jika ada file mengarah ke luar root ekstrak, proses ditolak seketika (HTTP 422).
- [ ] **Kriteria 3 (Extension Allowlist Guard)**: Hanya file dengan ekstensi statis yang diizinkan (`html`, `htm`, `css`, `js`, `mjs`, `json`, `svg`, `png`, `jpg`, `jpeg`, `webp`, `gif`, `ico`, `woff`, `woff2`, `ttf`, `otf`, `txt`, `xml`, `map`). File `.php`, `.sh`, `.exe`, `.env`, dll. ditolak.
- [ ] **Kriteria 4 (Index HTML Existence)**: Harus terdapat minimal satu file `index.html` di root direktori ZIP.
- [ ] **Kriteria 5 (DoS / Zip Bomb Protection)**: Batas maksimal uncompressed total 100 MB dan maksimal 2.000 file per arsip.
- [ ] **Kriteria 6 (Atomic Deployment)**: Ekstrak ke folder timestamp baru terlebih dahulu. Jika lolos 100% verifikasi, buat symlink rilis terbaru. Jika gagal, cleanup folder temporary tanpa merusak rilis yang sudah aktif.
- [ ] **Kriteria 7 (API Endpoints)**:
  - `POST /api/deploy` - Menerima form `slug`, `token`, `file (zip)`.
  - `GET /api/sites` - Mengambil daftar halaman yang aktif dideploy.
  - `DELETE /api/sites/:slug` - Menghapus rilis & symlink halaman.

---

## 3. Struktur Direktori di Server (VPS)

- **Base Release Dir**: `/var/www/releases/<slug>/<timestamp>/`
- **Active Symlink Dir**: `/var/www/staticpage/<slug>` -> `/var/www/releases/<slug>/<timestamp>`
- **Live URL**: `https://neoproject.my.id/staticpage/<slug>/`

---

## 4. Kontrak API

| Method | Endpoint Path | Auth Guard | Payload | Response Sukses |
| :---: | :--- | :---: | :--- | :--- |
| `POST` | `/api/deploy` | Bearer Token / Header | Multipart Form (`slug`, `file`) | `200 OK` (JSON: url, files_scanned, timestamp) |
| `GET` | `/api/sites` | Bearer Token / Header | - | `200 OK` (JSON: array of active sites) |
| `DELETE` | `/api/sites/:slug` | Bearer Token / Header | - | `200 OK` (JSON: success status) |
| `GET` | `/api/health` | Public | - | `200 OK` (JSON: status healthy) |
