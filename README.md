# 🚀 Lean Agentic Harness Template (Antigravity + NeoKanban)

> **Starter Template Boilerplate** resmi untuk pengembangan perangkat lunak AI-native menggunakan asisten **Antigravity** dan platform **NeoKanban**.

Repositori ini adalah template siap pakai (*starter harness*) yang menerapkan disiplin rekayasa perangkat lunak modern:
- **Universal Root `AGENTS.md`:** Instruksi ringkas standar terbuka AAIF (*Instruction Budget* < 100 baris).
- **Living Context Hub (`docs/context/`):** Konteks proyek multi-berkas dua arah (*Zero RAG*) tersinkronisasi ke NeoKanban.
- **UI/UX Studio & Governance:** Manajemen token desain (`token-design.json`), komponen template, dan penanganan review anotasi visual.
- **AI Skill Library:** Katalog skill otomatis di `.agents/skills/`.
- **TDD & Isolasi Git:** Red-Green-Refactor di feature branch dengan **ATLAS Pre-Flight Gatekeeper** sebelum task masuk ke Review.
- **Single Living Handoff:** Melacak sesi aktif di `docs/HANDOFF.md` tanpa polusi file log harian.

---

## 🛠️ Cara Menggunakan Template untuk Proyek Baru

### 1. Salin Folder Template
Salin seluruh isi repositori `harnes-neokanban` ke direktori proyek baru Anda:

```bash
# Contoh di PowerShell / Bash:
cp -r harnes-neokanban ../nama-proyek-baru
cd ../nama-proyek-baru
```

### 2. Install Dependensi
```bash
npm install
```

### 3. Inisialisasi Koneksi ke NeoKanban
Hubungkan proyek baru ke board NeoKanban yang sesuai:

```bash
npx tsx scripts/kanban.ts init \
  --url "https://neoproject.my.id/neokanban" \
  --board "<ID_BOARD_NEOKANBAN_BARU>" \
  --username "kresna" \
  --role "all-roles"
```
*(File `.neokanban.json` akan otomatis terbuat dan dimasukkan ke `.gitignore` agar rahasia aman).*

### 4. Sesuaikan Konteks Proyek
Isi informasi arsitektur dan bisnis proyek Anda di:
- [`docs/context/INDEX.md`](docs/context/INDEX.md) — Nama proyek, deskripsi, dan target pengguna.
- [`docs/context/ARCHITECTURE.md`](docs/context/ARCHITECTURE.md) — Tech stack dan arsitektur sistem.
- [`docs/ui-governance/token-design.json`](docs/ui-governance/token-design.json) — Warna, font, dan spacing token.

Unggah seluruh konteks awal ke papan NeoKanban:
```bash
npx tsx scripts/kanban.ts context:push
npx tsx scripts/kanban.ts tokens:push
```

### 5. Mulai Siklus Pengembangan Fitur
1. **Definisikan Fitur:** Buat `docs/context/FEATURE_[NAMA].md` menggunakan acuan [`docs/context/FEATURE_TEMPLATE.md`](docs/context/FEATURE_TEMPLATE.md) dan daftarkan di `INDEX.md`.
2. **Buat Rencana Kerja:** Susun implementation plan di `docs/plans/YYYY-MM-DD-[fitur].md` dari [`docs/templates/plan-template.md`](docs/templates/plan-template.md).
3. **Publikasikan ke Board:**
   ```bash
   npx tsx scripts/kanban.ts publish docs/plans/YYYY-MM-DD-[fitur].md
   ```
4. **Eksekusi TDD di Feature Branch:**
   ```bash
   git checkout -b feat/[nama-fitur]
   npx tsx scripts/kanban.ts start <cardId>
   npx tsx scripts/kanban.ts check <cardId> "Step 1"
   npx tsx scripts/kanban.ts review <cardId> --report "Test suite lulus 100%"
   ```

---

## 📂 Struktur Direktori Template

```
harnes-neokanban/
├── .agents/
│   ├── AGENTS.md                  # Konfigurasi operasional agen
│   ├── rules/                     # Aturan workflow, code quality, UI standards
│   ├── skills/                    # 6 Core Skills (orchestration, engineering, UI/UX, security, dll)
│   └── specialists/               # 6 Agen spesialis domain (frontend, backend, db, qa, dll)
├── docs/
│   ├── context/                   # Living context multi-file yang disinkronkan ke NeoKanban
│   │   ├── INDEX.md               # Peta navigasi utama konteks
│   │   ├── ARCHITECTURE.md        # Arsitektur & tech stack proyek
│   │   ├── DATABASE.md            # ERD & skema relasional
│   │   ├── DESIGN_SYSTEM.md       # Standar visual & panduan desain
│   │   ├── BEHAVIOR.md            # Disiplin agen & larangan auto-done
│   │   ├── REPOSITORY.md          # Konvensi Git & aturan TDD
│   │   ├── SECURITY.md            # Sanitasi input & audit keamanan
│   │   └── FEATURE_TEMPLATE.md    # Template spesifikasi modul fitur baru
│   ├── templates/                 # Template rancangan rencana (plan, spec, tokens)
│   ├── ui-governance/             # Token desain & template komponen UI Studio
│   └── HANDOFF.md                 # Single Living Handoff aktif sesi kerja
├── scripts/
│   ├── kanban.ts                  # Engine CLI integrasi NeoKanban, UI Studio & Skills
│   └── test-kanban.ts             # Test suite internal CLI (100% pass)
├── AGENTS.md                      # Entry point AAIF ringkas (< 100 baris)
├── HARNESS.md                     # Panduan komprehensif seluruh fitur harness
├── package.json
└── tsconfig.json
```

---

## 📖 Dokumentasi Lengkap
- Baca [`HARNESS.md`](HARNESS.md) untuk referensi lengkap perintah CLI dan panduan operasional.
- Baca [`AGENTS.md`](AGENTS.md) untuk aturan cepat instruksi agen AI.

