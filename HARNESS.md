# Lean Agentic Harness (Antigravity + NeoKanban)

Selamat datang di **Lean Agentic Harness**. Sistem ini dirancang untuk asisten AI **Antigravity**, memberikan fondasi pengembangan perangkat lunak yang berdisiplin tinggi, terstruktur, dan bersih dari berkas berlebih (*zero clutter*).

Terintegrasi penuh dengan **NeoKanban**, **4 Core Lean Skills**, tata kelola **UI Consistency Governance (Design Tokens & Component Registry)**, siklus **TDD & Isolasi Git**, serta **Living Handoff Tunggal**.

---

## 1. Filosofi & Prinsip Inti

1. **Universal Root `AGENTS.md` (Instruction Budget < 100 Lines)**:
   - Standar terbuka AAIF (Agentic AI Foundation) sebagai antarmuka ringkas agen AI di root proyek.
2. **Pahami Dahulu & Bertanya Interaktif (Zero Information Gaps)**:
   - Telusuri codebase dan arsitektur terlebih dahulu secara menyeluruh.
   - Ajukan pertanyaan interaktif terstruktur (`ask_question`) sebelum menyusun solusi atau rencana kerja.
3. **TELOS Intent Alignment & Konteks Fitur Fungsional (`FEATURE_*.md`)**:
   - Setiap fitur membandingkan **Current State** dan **Ideal State** serta kriteria verifikasi bebas asumsi (**Falsifiable Verification Criteria**).
   - Agen **DILARANG KERAS** melompat ke penulisan plan atau kode sebelum dokumen spesifikasi fitur per modul (`docs/context/FEATURE_[NAMA_FITUR].md`) terdaftar di `docs/context/INDEX.md`.
4. **Alur Kerja 3-Stage Agent Crew (Planner → Worker → Checker)**:
   - **Planner**: Merancang arsitektur & breakdown task dengan dependensi terukur.
   - **Worker**: Menulis kode di branch/worktree terisolasi dengan siklus TDD (Red-Green-Refactor).
   - **Checker**: Mengaudit kode secara independen (`qa-tester`), menjalankan audit keamanan & test suite.
5. **ATLAS Pre-Flight Test Gatekeeper & Safe Review Gate**:
   - CLI `scripts/kanban.ts review` secara otomatis memvalidasi kelulusan test suite lokal sebelum mengizinkan kartu berpindah ke `Review`.
   - Agen dilarang keras melakukan Auto-Done. Pemindahan ke `Done` hanya dilakukan oleh manusia/user.
6. **Tata Kelola Konsistensi UI (Design Tokens & Component Registry)**:
   - Acuan tunggal `token-design.json` (warna, font, spasi) dan repositori template komponen `template-[nama].html`.
7. **Single Living Handoff (`docs/HANDOFF.md`)**:
   - Status kerja dipelihara dalam 1 berkas tunggal `docs/HANDOFF.md` dan disinkronkan ke Living Context NeoKanban (zero clutter).

---

## 2. Struktur Direktori Repositori

```
harnes-neokanban/
├── .agents/
│   ├── AGENTS.md                  # Konfigurasi & aturan operasional agen
│   ├── rules/                     # Aturan standar (workflow, code-quality, ui-standards)
│   ├── skills/                    # Core Lean Skills
│   │   ├── agent-orchestration/   # Delegasi subagent & parallel dispatching
│   │   ├── engineering-discipline/# TDD, isolasi Git, systematic debugging
│   │   ├── kanban-workflow/       # Setup board, planning, card lifecycle, handoff
│   │   ├── ui-ux-governance/      # Design tokens, component templates, WCAG AA
│   │   ├── ui-ux-pro-max/         # Design Intelligence engine (79 styles, 192 palettes)
│   │   └── security-audit/        # Trail of Bits security scan (SAST, supply-chain, secrets)
│   └── specialists/               # 6 Spesialis domain (frontend, backend, ux-ui, dll)
├── docs/
│   ├── context/                   # Living Context sistem terintegrasi NeoKanban
│   │   ├── INDEX.md               # [WAJIB] Peta navigasi utama seluruh konteks
│   │   ├── ARCHITECTURE.md        # [WAJIB] Arsitektur sistem & tech stack
│   │   ├── DATABASE.md            # [KONDISIONAL] Skema relasi & data models
│   │   ├── DESIGN_SYSTEM.md       # [WAJIB] Standar token desain & komponen UI
│   │   ├── AGENTS.md              # [WAJIB] Matriks spesialis & orkestrasi
│   │   ├── BEHAVIOR.md            # [WAJIB] Disiplin klarifikasi & larangan auto-done
│   │   ├── SECURITY.md            # [WAJIB] Sanitasi input & secret management
│   │   ├── REPOSITORY.md          # [WAJIB] Konvensi Git, branching, dan TDD
│   │   ├── HANDOFF.md             # [WAJIB] Konteks riwayat living handoff
│   │   ├── ROLE_PERMISSION.md     # [OPSIONAL] Matriks RBAC hak akses pengguna
│   │   ├── DEPLOY.md              # [OPSIONAL] Konfigurasi environment & deploy
│   │   └── FEATURE_TEMPLATE.md    # [TEMPLATE] Template spesifikasi fitur baru
│   ├── HANDOFF.md                 # Single Living Source of Truth sesi kerja aktif
│   ├── templates/                 # Template standar rencana (plan, spec, tokens)
│   └── ui-governance/             # Token desain & template komponen siap pakai
│       ├── token-design.json
│       ├── design-system.md
│       └── components/
├── scripts/
│   ├── kanban.ts                  # Engine CLI integrasi NeoKanban & governance
│   └── test-kanban.ts             # Test suite internal CLI
├── .kanban-map.json               # Mapping lokal kartu task board
├── .neokanban.json                # Konfigurasi koneksi NeoKanban
├── package.json
└── tsconfig.json
```

---

## 3. Perintah CLI `scripts/kanban.ts`

```powershell
# --- 1. Setup Awal & Healthcheck ---
# Uji koneksi ke NeoKanban
npx tsx scripts/kanban.ts ping

# Inisialisasi konfigurasi proyek
npx tsx scripts/kanban.ts init --username kresna --role all-roles

# --- 2. Living Context NeoKanban ---
# Periksa kelengkapan file konteks proyek
npx tsx scripts/kanban.ts context:check

# Unggah seluruh docs/context/*.md ke NeoKanban Board Context
npx tsx scripts/kanban.ts context:push

# Tarik dokumen konteks dari NeoKanban ke lokal docs/context/
npx tsx scripts/kanban.ts context:pull

# --- 3. Perencanaan & Kartu Task ---
# Publikasikan rencana markdown ke papan NeoKanban
npx tsx scripts/kanban.ts publish docs/plans/2026-10-19-fitur.md

# Tandai kartu mulai dikerjakan (In Progress)
npx tsx scripts/kanban.ts start <cardId>

# Centang checklist subtask pada kartu
npx tsx scripts/kanban.ts check <cardId> "Step 1"

# Pindahkan kartu ke kolom Review (otomatis menjalankan Pre-Flight Test Gatekeeper)
npx tsx scripts/kanban.ts review <cardId> --report "Seluruh unit test lulus 100%" [--skip-preflight] [--preflight-cmd <cmd>]

# --- 4. Tata Kelola UI/UX Studio, Token & Review Annotations ---
# Pengecekan token design di NeoKanban
npx tsx scripts/kanban.ts tokens:check

# Tarik token design dari NeoKanban ke lokal
npx tsx scripts/kanban.ts tokens:pull

# Unggah token design lokal ke NeoKanban
npx tsx scripts/kanban.ts tokens:push

# Publikasikan komponen ke entitas UI/UX Studio NeoKanban (UiComponent)
npx tsx scripts/kanban.ts component:publish docs/ui-governance/components/template-<nama>.html

# Tarik seluruh komponen dari UI/UX Studio NeoKanban ke direktori lokal
npx tsx scripts/kanban.ts component:pull

# Publikasikan mockup prototipe halaman ke UI/UX Studio NeoKanban (UiPage)
npx tsx scripts/kanban.ts page:push docs/ui-governance/pages/<nama>.html

# Tarik seluruh halaman prototipe dari UI/UX Studio ke lokal
npx tsx scripts/kanban.ts page:pull

# Ambil anotasi review visual (pin & bounding box) dari canvas UI Studio
npx tsx scripts/kanban.ts ui:annotations

# Sintesis komponen baru sesuai standar token
npx tsx scripts/kanban.ts component:new <nama-komponen>

# Query UI/UX Pro Max Design Intelligence (styles, colors, guidelines, charts)
npx tsx scripts/kanban.ts ui:search "<query>" [--domain <style|color|typography|ux|chart|icons>]

# Hasilkan rekomendasi Design System lengkap dengan UI/UX Pro Max
npx tsx scripts/kanban.ts ui:design "<produk/industri/kata-kunci>"

# --- 5. AI Skill Library NeoKanban ---
# Lihat katalog paket skill AI yang tersedia di server NeoKanban
npx tsx scripts/kanban.ts skills:list

# Unduh dan pasang paket skill ke direktori lokal .agents/skills/<slug>/
npx tsx scripts/kanban.ts skills:pull <slug>

# --- 6. Living Handoff Sesi ---
# Catat handoff sesi ke docs/HANDOFF.md & sinkronkan ke NeoKanban
npx tsx scripts/kanban.ts handoff "<nama-sesi>" --summary "Ringkasan milestone..."
```

---

## 4. Tabel Spesialis Domain

| Peran Spesialis | Lingkup Keahlian | File Definisi |
| :--- | :--- | :--- |
| `ux-ui-pro-max` | Desain antarmuka premium, WCAG AA Accessibility, sistem tipografi, palet semantik, micro-interactions 150–300ms | `.agents/specialists/ux-ui-pro-max.md` |
| `frontend-specialist` | React, Next.js, Tailwind CSS, Component State, Integrasi Form | `.agents/specialists/frontend-specialist.md` |
| `backend-specialist` | REST API, Node.js (Express/Fastify), Python (FastAPI), Routing, Auth | `.agents/specialists/backend-specialist.md` |
| `database-specialist`| PostgreSQL, Prisma ORM, SQLite, Migrasi Skema, Query Optimization | `.agents/specialists/database-specialist.md` |
| `debugger-specialist`| Error Tracing, Stack Analysis, Root-Cause Diagnosis, Bug Minimal Reproduksi | `.agents/specialists/debugger-specialist.md` |
| `qa-tester`          | Unit Testing, Integration Testing, Edge Case, Test Suite Hardening | `.agents/specialists/qa-tester.md` |
