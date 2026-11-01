# Agent Behavioral Protocols & Disciplines

---

## 1. Deep Pre-Understanding (Pahami Dahulu)

Sebelum memberikan jawaban teknis, membuat rencana, atau menulis kode:
- Telusuri codebase, skema arsitektur, dan relasi data yang ada.
- Jangan berasumsi jika konteks tidak lengkap.

---

## 2. Interactive Clarification (`ask_question`)

- Jika kebutuhan pengguna ambigu, memiliki beberapa alternatif arsitektur, atau melibatkan keputusan penting, ajukan klarifikasi interaktif menggunakan `ask_question`.
- Susun opsi terstruktur dengan opsi rekomendasi di baris pertama `(Recommended)`.

---

## 3. Mandatory Feature Context Construction (`FEATURE_*.md`)

- **Wajib Bangun Konteks Fitur**: Setelah klarifikasi interaktif selesai, agen **WAJIB** menyusun dokumen konteks fitur fungsional (`docs/context/FEATURE_[NAMA_FITUR].md`) untuk setiap domain/modul fitur yang ada dalam aplikasi mengacu pada `docs/context/FEATURE_TEMPLATE.md`.
- **Dilarang Langsung Bikin Plan**: Agen **DILARANG KERAS** langsung membuat Implementation Plan (`docs/plans/`) atau melompat ke penulisan kode sebelum seluruh konteks fitur fungsional terdokumentasi dan didaftarkan pada matriks `docs/context/INDEX.md`.
- Setiap berkas konteks fitur wajib memuat:
  1. Ikhtisar & Tujuan Fitur (domain bisnis & target peran/role).
  2. Kebutuhan Fungsional & Acceptance Criteria (checklist terukur).
  3. Skema Data & Model Terkait (tabel basis, atribut kunci, status).
  4. Kontrak API & Endpoints Terkait (method, route, payload, response).
  5. Halaman UI, Komponen, dan Hook Terkait.
  6. Alur Interaksi Pengguna (User Journey step-by-step).

---

## 4. Safe Review Gate (Larangan Keras Auto-Done)

- Asisten AI **DILARANG KERAS** memindahkan kartu kanban langsung ke status `Done`.
- Alur yang sah:
  1. Mulai task di branch terisolasi (`npm run kanban start <cardId>`).
  2. Centang checklist TDD (`npm run kanban check <cardId> "<step>"`).
  3. Pindahkan ke kolom `Review` dengan menyertakan bukti verifikasi:
     ```powershell
     npm run kanban -- review <cardId> --report "Seluruh unit test lulus 100%"
     ```
  4. Status `Done` **hanya boleh diberikan oleh pengguna/manusia**.

---

## 5. Single Living Handoff Protocol

- Di awal sesi baru: Wajib membaca `docs/HANDOFF.md` terlebih dahulu untuk memulihkan state.
- Di akhir milestone: Catat handoff tunggal via `npm run kanban -- handoff "<nama-sesi>"`.
