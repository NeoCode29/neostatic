# Antigravity Agent Configuration — Lean NeoKanban Harness

Dokumen ini mendefinisikan aturan operasional, protokol kerja, inventaris skill terpadu, dan spesialis domain untuk asisten AI Antigravity.

---

## 1. Aturan Emas & Kebiasaan Utama (Golden Rules)

1. **BACA `docs/HANDOFF.md` DI AWAL SETIAP SESI**:
   - Pulihkan state pengerjaan, ketahui branch aktif dan langkah lanjutan langsung dari satu berkas hidup tanpa bertanya ulang ke pengguna.
2. **PAHAMI DULU & BERTANYA INTERAKTIF (`ask_question`)**:
   - Telusuri codebase dan arsitektur terlebih dahulu secara menyeluruh sebelum mengusulkan solusi atau rencana.
   - Ajukan klarifikasi interaktif menggunakan `ask_question` untuk memastikan cakupan fitur, alur UX, dan edge case telah disepakati bersama.
3. **KONSISTENSI UI VIA TOKEN & KOMPONEN REGISTRY**:
   - Pada task frontend, periksa `docs/ui-governance/token-design.json` dan pustaka komponen `template-[nama].html` sebelum membangun antarmuka.
4. **ISOLASI GIT & SIKLUS TDD**:
   - Dilarang keras melakukan commit atau eksperimen langsung di branch `master`/`main`. Buat branch fitur terisolasi.
   - Terapkan siklus **RED-GREEN-REFACTOR** untuk seluruh penulisan logika dan fungsionalitas.
5. **LARANGAN AUTO-DONE (NEVER AUTO-DONE)**:
   - Agen dilarang keras memindahkan kartu langsung ke kolom `Done`.
   - Kartu yang seluruh checklist dan pengujiannya selesai dipindahkan ke kolom `Review` (`npm run kanban review <cardId> --report "..."`).
6. **SPESIALISASI DOMAIN**:
   - Delegasikan task kepada spesialis yang sesuai (`.agents/specialists/`).
7. **LIVING HANDOFF TUNGGAL (NO LOG CLUTTER)**:
   - Setiap milestone atau penutupan sesi dicatat ke `docs/HANDOFF.md` yang secara otomatis menjaga status aktif dan membatasi riwayat tanpa menghasilkan file log per tanggal.

---

## 2. Inventaris Skill Terpadu (4 Core Lean Skills)

| Skill | Lokasi | Cakupan Utama |
| :--- | :--- | :--- |
| **`kanban-workflow`** | `.agents/skills/kanban-workflow/` | Setup & ping koneksi board, authoring rencana implementasi, publikasi kartu, transisi kolom, pelacakan subtask, dan living handoff. |
| **`engineering-discipline`** | `.agents/skills/engineering-discipline/` | Siklus TDD, isolasi Git branch/worktree, 4-phase systematic debugging, verifikasi sebelum selesai, dan review kode. |
| **`ui-ux-pro-max`** | `.agents/skills/ui-ux-pro-max/` | Mesin pencari design intelligence lokal (79 styles, 192 palettes, 74 font pairings, 119 UX guidelines, 25 charts, 22 tech stacks). |
| **`ui-ux-governance`** | `.agents/skills/ui-ux-governance/` | Pengelolaan token desain, penggunaan ulang komponen template, standar aksesibilitas WCAG AA, dan preview visual. |
| **`security-audit`** | `.agents/skills/security-audit/` | Audit keamanan kode berbasis metodologi Trail of Bits (SAST Semgrep, supply-chain npm audit, insecure defaults, secret hunting). |
| **`agent-orchestration`** | `.agents/skills/agent-orchestration/` | Pendelegasian task dengan subagent berkonteks bersih, two-stage review, dan eksekusi agen paralel tanpa konflik. |

---

## 3. Aturan Standar (`.agents/rules/`)

- **`workflow-rules.md`**: Protokol pemahaman mendalam, klarifikasi interaktif (`ask_question`), siklus kartu NeoKanban, larangan auto-done, dan living handoff tunggal.
- **`code-quality.md`**: Disiplin TDD (Red-Green-Refactor), isolasi branch Git, prinsip kesederhanaan kode (YAGNI), dan whole-branch verification.
- **`ui-standards.md`**: Penggunaan design token sebagai single source of truth, penggunaan template komponen, standar WCAG AA, dan 6 state interaktif.

---

## 4. Daftar Spesialis Domain (`.agents/specialists/`)

1. **`ux-ui-pro-max`**: Desain antarmuka premium, WCAG AA Accessibility, sistem tipografi, palet semantik, animasi micro-interaction 150–300ms, shadcn/ui.
2. **`frontend-specialist`**: Komponen React/Next.js, Tailwind CSS, component state, formulir interaktif.
3. **`backend-specialist`**: REST API, Node.js (Express/Fastify), Python (FastAPI), validasi skema, auth/middleware.
4. **`database-specialist`**: PostgreSQL, Prisma ORM, pemodelan skema relasional, optimasi query, migrasi aman.
5. **`debugger-specialist`**: Error tracing, analisis stack trace, reproduksi bug minimal, isolasi akar masalah.
6. **`qa-tester`**: Test suites, unit test, integration test, boundary conditions, edge cases.
