# Role & Permission Context (RBAC)

---

## 1. Daftar Role Pengguna

| Role | Deskripsi | Tingkat Akses |
| :--- | :--- | :--- |
| **`super_admin`** | Administrator sistem penuh | Akses menyeluruh (CRUD semua entitas, billing, user management) |
| **`admin`** | Manajer ruang kerja/organisasi | Akses manajemen proyek, anggota tim, dan konfigurasi |
| **`member`** | Anggota tim reguler | Akses baca & tulis pada tugas/proyek yang ditugaskan |
| **`viewer`** | Pengamat / Read-Only | Hanya memiliki izin membaca data tanpa izin mutasi |

---

## 2. Matriks Izin (Permission Matrix)

| Aksi / Sumber Daya | `super_admin` | `admin` | `member` | `viewer` |
| :--- | :---: | :---: | :---: | :---: |
| **Kelola Organisasi** | ✅ | ❌ | ❌ | ❌ |
| **Kelola Anggota Tim** | ✅ | ✅ | ❌ | ❌ |
| **Buat / Edit Proyek** | ✅ | ✅ | ❌ | ❌ |
| **Buat / Edit Task** | ✅ | ✅ | ✅ | ❌ |
| **Komentar & Review** | ✅ | ✅ | ✅ | ❌ |
| **Lihat Dashboard** | ✅ | ✅ | ✅ | ✅ |

---

## 3. Implementasi Middleware / Guard

- **Frontend**: Lindungi rute menggunakan Route Guards berbasis role pengguna aktif.
- **Backend**: Terapkan middleware otorisasi (e.g. `requireRole(['admin', 'super_admin'])`) pada setiap endpoint mutasi.
