---
name: kanban-workflow
description: End-to-end management of NeoKanban board, project initialization, planning, card lifecycle transitions, checklist progress, and session handoffs.
---

# Kanban Workflow Skill

Gunakan skill ini untuk mengelola alur kerja proyek dari inisialisasi, penyusunan rencana (planning), publikasi kartu, transisi kolom, pelacakan subtask, hingga living handoff.

---

## 1. Alur Inisialisasi Proyek (`kanban:init` & `ping`)

Sebelum memulai pekerjaan baru, pastikan status koneksi board telah terverifikasi:
```powershell
# 1. Healthcheck koneksi server
npx tsx scripts/kanban.ts ping

# 2. Inisialisasi profil & konfigurasi
npx tsx scripts/kanban.ts init --username kresna --role all-roles
```

---

## 2. Penyusunan Living Context & Konteks Fitur (`FEATURE_*.md`)

Sebelum membuat implementation plan, agen **WAJIB** memastikan fondasi konteks sistem dan fitur fungsional telah lengkap:
1. **Konteks Teknis Sistem**: `ARCHITECTURE.md`, `DATABASE.md`, `DESIGN_SYSTEM.md`, `ROLE_PERMISSION.md`, `SECURITY.md`, dll.
2. **Konteks Fitur Fungsional (`FEATURE_*.md`)**:
   - Setiap fitur/modul bisnis wajib memiliki dokumen spesifikasi `docs/context/FEATURE_[NAMA_FITUR].md` menggunakan acuan `FEATURE_TEMPLATE.md`.
   - Dokumen memuat: Ikhtisar, Acceptance Criteria, Skema Tabel, Kontrak API, Halaman & Komponen UI, serta Alur Pengguna (User Journey).
   - Seluruh berkas fitur wajib didaftarkan pada matriks `docs/context/INDEX.md`.
3. **Validasi & Sinkronisasi**:
   ```powershell
   npx tsx scripts/kanban.ts context:check
   npx tsx scripts/kanban.ts context:push
   ```
> **Aturan Keras**: Dilarang membuat file rencana (`docs/plans/`) sebelum berkas `FEATURE_*.md` relevan telah dibuat.

---

## 3. Penyusunan Rencana (Implementation Plan)

Saat fitur baru telah disepakati melalui klarifikasi awal:
1. Buat file rencana di `docs/plans/YYYY-MM-DD-<nama-fitur>.md` menggunakan template standar (`docs/templates/plan-template.md`).
2. Pecah pekerjaan menjadi task-task kecil terisolasi (estimasi 2–5 menit per task).
3. Setiap task wajib menyertakan:
   - **`**Agent:**`**: Spesialis yang bertanggung jawab (misal `backend-specialist`, `ux-ui-pro-max`).
   - **`**Priority:**`**: `HIGH`, `MEDIUM`, atau `LOW`.
   - **`**Files:**`**: Daftar berkas Create, Modify, dan Test.
   - **`**Steps:**`**: Checklist TDD terstruktur (`- [ ] **Step 1: ...**`).

---

## 4. Publikasi & Siklus Kartu (Card Lifecycle)

```
[Backlog / Plan] ──► npx tsx scripts/kanban.ts publish <planPath>
                          │
                          ▼
                       [To Do]
                          │
                          ▼ npx tsx scripts/kanban.ts start <cardId>
                    [In Progress] (Branch Fitur Terisolasi)
                          │
                          ├─► npx tsx scripts/kanban.ts check <cardId> "Step X"
                          │
                          ▼ npx tsx scripts/kanban.ts review <cardId> --report "..."
                       [Review] (Safe Review Gate)
                          │
                          ▼ [Human Approval Only]
                        [Done]
```

### Aturan Emas Siklus Kartu:
1. **Mulai Task**: Jalankan `npx tsx scripts/kanban.ts start <cardId>`.
2. **Centang Progress**: Jalankan `npx tsx scripts/kanban.ts check <cardId> "<pola-langkah>"`.
3. **Pindahkan ke Review**: Setelah test 100% hijau, pindahkan ke `Review` via `npx tsx scripts/kanban.ts review <cardId> --report "<ringkasan-verifikasi>"`.
4. **Larangan Auto-Done**: Agen **DILARANG** memindahkan kartu ke `Done`. Pemindahan ke `Done` adalah hak prerogatif pengguna/manusia.

---

## 5. Living Handoff Management

Handoff dipelihara dalam satu file tunggal: `docs/HANDOFF.md`.
- **Awal Sesi**: Selalu baca `docs/HANDOFF.md` terlebih dahulu.
- **Akhir Milestone / Sesi**: Catat progres via CLI:
  ```powershell
  npx tsx scripts/kanban.ts handoff "<nama-sesi>" --summary "<ringkasan>"
  ```
- File `docs/HANDOFF.md` secara otomatis mempertahankan status aktif terkini dan 2 riwayat terakhir tanpa tumpukan file log.
