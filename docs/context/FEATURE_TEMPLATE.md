# Feature Context: [Nama Fitur]

> Dokumen spesifikasi fitur tingkat modul (Single Source of Truth) berbasis **TELOS Intent Alignment**.

---

## 1. Ikhtisar Fitur & TELOS Intent

- **Nama Modul**: [Contoh: Authentication & Multi-Role RBAC]
- **Target Pengguna / Peran**: [Contoh: Superadmin, Teknisi, Kasir]
- **Current State (Kondisi Saat Ini)**:
  - [Deskripsi masalah / celah yang belum terselesaikan]
- **Ideal State (Kondisi Sukses)**:
  - [Definisi selesai yang presisi, performan, dan aman]

---

## 2. Kebutuhan Fungsional & Kriteria Pembuktian (Falsifiable Verification)

- [ ] **Kriteria 1**: [Deskripsi perilaku yang diharapkan & cara verifikasinya]
- [ ] **Kriteria 2**: [Validasi input, batasan bisnis, respons status HTTP]
- [ ] **Kriteria 3**: [Zero error log, penanganan timeout & edge case]

---

## 3. Skema Data & Model Terkait

- **Tabel Basis**: `[nama_tabel]`
- **Atribut Kunci & Tipe**:
  - `id` (UUID / CUID / Int)
  - `status` (ENUM)
  - `created_at` / `updated_at` (Timestamp)
- **Relasi (Foreign Keys)**: `[tabel_a] -> [tabel_b]`

---

## 4. Kontrak API / Layanan Terkait

| Method | Endpoint Path | Auth Guard | Payload Ringkas | Response Sukses |
| :---: | :--- | :---: | :--- | :--- |
| `POST` | `/api/v1/...` | `jwt` | `{ "key": "value" }` | `201 Created` |
| `GET` | `/api/v1/...` | `jwt + permission` | `-` | `200 OK` |

---

## 5. Komponen UI & Berkas Terlibat

- **Komponen UI**: `src/components/...` (mengacu pada `docs/ui-governance/token-design.json`)
- **Pages & Routing**: `src/pages/...`
- **Services / Handlers**: `src/services/...`
- **Suite Pengujian**: `tests/...`

---

## 6. Alur Interaksi Pengguna (User Journey Step-by-Step)

1. **Inisiasi**: Pengguna mengakses halaman ...
2. **Aksi & Validasi**: Pengguna memasukkan data, sistem memicu validasi skema di frontend.
3. **Eksekusi Backend**: Request diproses dengan role & permission guard.
4. **Feedback Visual**: Menampilkan indikator loading, toast sukses/error, dan update state real-time.
