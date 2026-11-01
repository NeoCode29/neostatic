# Project Context Index - Neostatic

> **Living Source of Truth**: Dokumen ini adalah peta navigasi utama untuk sistem **Neostatic** (Self-hosted Static HTML Deployment System dengan Rust & React).

---

## 1. Ringkasan Proyek

- **Nama Proyek**: Neostatic
- **Deskripsi**: Sistem deployment mandiri (*self-hosted*) untuk file statis HTML/CSS/JS di VPS dengan validasi keamanan ketat (*anti zip-slip*, *extension allowlist*, *zip-bomb protection*) serta deployment atomik berbasis symlink yang disajikan langsung oleh Nginx.
- **Target Domain & URL**: `https://neoproject.my.id/staticpage/<nama-halaman>/`
- **Dashboard URL**: `https://neoproject.my.id/deploy-manager/`
- **Target Pengguna**: Developer / Admin VPS
- **Status Saat Ini**: Inisialisasi & Pengembangan Modul Inti

---

## 2. Peta Dokumen Konteks (Context Matrix)

| Nama File | Kategori | Status | Deskripsi Singkat |
| :--- | :--- | :--- | :--- |
| **[`INDEX.md`](./INDEX.md)** | Navigasi | Wajib | Peta indeks dan daftar isi utama seluruh konteks proyek |
| **[`ARCHITECTURE.md`](./ARCHITECTURE.md)** | Teknis | Wajib | Arsitektur monorepo (Rust backend + React frontend), diagram alur deploy, atomic symlink |
| **[`SECURITY.md`](./SECURITY.md)** | Keamanan | Wajib | Standar verifikasi ZIP (Zip-Slip, Allowlist, Zip Bomb, Slug Regex) |
| **[`DEPLOY.md`](./DEPLOY.md)** | Operasional | Wajib | Konfigurasi Nginx VPS (`neoproject.my.id`), systemd service, dan environment |
| **[`HANDOFF.md`](./HANDOFF.md)** | Riwayat | Wajib | Status aktif sprint saat ini, fokus pengerjaan, dan langkah berikutnya |
| **[`FEATURE_STATIC_DEPLOYER_VALIDATOR.md`](./FEATURE_STATIC_DEPLOYER_VALIDATOR.md)** | Fungsional | Aktif | Spesifikasi modul verifikasi keamanan Rust dan API upload |
| **[`FEATURE_NEOKANBAN_INTEGRATION.md`](./FEATURE_NEOKANBAN_INTEGRATION.md)** | Integrasi | Aktif | Penyelarasan penuh dengan board NeoKanban |

---

## 3. Protokol Pembaruan Konteks

1. Setiap keputusan arsitektur baru atau penambahan endpoint wajib dicatat di `docs/context/`.
2. Seluruh context disinkronkan ke Board NeoKanban (ID: `cmvy2gfcm0001vas046952y1s`).
