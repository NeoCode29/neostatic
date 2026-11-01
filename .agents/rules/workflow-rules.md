# Workflow & Kanban Rules

> Diadaptasi dari standar industri modern (`agents.md`, `LifeOS TELOS`, `CodeAF Factory`, dan `ATLAS Pre-Flight Testing`).

## 1. Deep Pre-Understanding & Interactive Clarification
- **Pahami Dahulu (Zero Assumption)**: Sebelum menyusun solusi atau rencana, telusuri kode dan arsitektur terlebih dahulu secara menyeluruh.
- **Klarifikasi Interaktif (`ask_question`)**: Ajukan pertanyaan berstruktur via `ask_question` untuk memastikan cakupan fitur, alur pengguna, dan batasan teknis disepakati bersama pengguna.

## 2. TELOS Intent & Mandatory Feature Context (`FEATURE_*.md`)
- **TELOS Intent Alignment**: Setiap perancangan harus membandingkan **Current State** (posisi saat ini) dengan **Ideal State** (kondisi target) serta mendefinisikan **Falsifiable Verification Criteria** (bukti verifikasi bebas asumsi).
- **Wajib Bangun Konteks Fitur Fungsional**: Setelah memahami kebutuhan dan menyelesaikan klarifikasi awal, agen **WAJIB** menyusun dokumen spesifikasi fitur per modul (`docs/context/FEATURE_[NAMA_FITUR].md`) menggunakan acuan `docs/context/FEATURE_TEMPLATE.md`.
- **Larangan Melompat ke Plan**: Agen **DILARANG KERAS** membuat implementation plan (`docs/plans/`) atau menulis kode sebelum seluruh konteks fitur fungsional terdokumentasi dan didaftarkan pada matriks `docs/context/INDEX.md`.

## 3. Alur Kerja 3-Stage Agent Crew (Planner → Worker → Checker)
- **Stage 1 — Planner (`agent-orchestration`)**:
  - Menganalisis domain bisnis, menyusun dokumen fitur fungsional, dan memecah task rencana kerja dengan dependensi jelas.
- **Stage 2 — Worker (`frontend-specialist`, `backend-specialist`, dll)**:
  - Bekerja di branch/worktree terisolasi.
  - Menerapkan siklus TDD ketat (Red-Green-Refactor).
- **Stage 3 — Checker (`qa-tester` / `security-audit`)**:
  - Mengaudit implementasi secara independen.
  - Menjalankan seluruh test suite dan security scan sebelum task diizinkan naik ke kolom Review.

## 4. Siklus Kartu NeoKanban & Safe Review Gate
- **Papan sebagai Source of Truth**: Setiap task development harus terdaftar di kartu NeoKanban / `.kanban-map.json`.
- **Transisi Kolom**:
  1. `To Do`: Kartu yang telah dipublikasikan dan siap dikerjakan.
  2. `In Progress`: Mulai dikerjakan (`npx tsx scripts/kanban.ts start <cardId>`) di branch terisolasi.
  3. `Review`: Setelah verifikasi Checker selesai dan **Pre-Flight Test Gatekeeper** lolos (`npx tsx scripts/kanban.ts review <cardId> --report "..."`).
  4. `Done`: **HANYA boleh dipindahkan oleh pengguna/human reviewer**. Agen dilarang keras melakukan auto-done.

## 5. ATLAS Pre-Flight Test Gatekeeper
- Perintah `kanban.ts review` secara otomatis memverifikasi bahwa test suite lokal (`npm test` / `vitest run`) berjalan dan lulus 100%.
- Jika ada tes yang gagal, perpindahan kartu ditolak secara otomatis untuk mencegah kode cacat masuk ke tahap review.

## 6. Living Handoff Protocol
- **Baca di Awal Sesi**: Asisten wajib membaca `docs/HANDOFF.md` di awal sesi untuk mengidentifikasi branch aktif, fokus terakhir, dan langkah berikutnya.
- **Update Bounded**: Pembaruan handoff dicatat langsung ke `docs/HANDOFF.md` dan disinkronkan ke Living Context NeoKanban tanpa menghasilkan tumpukan file log harian baru.
