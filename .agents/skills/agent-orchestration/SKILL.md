---
name: agent-orchestration
description: Multi-agent coordination, 3-stage crew pipeline (Planner -> Worker -> Checker), subagent task delegation with clean context, two-stage reviews, and safe parallel execution.
---

# Agent Orchestration Skill

Gunakan skill ini untuk mengatur delegasi pekerjaan ke subagent, mengelola alur kerja **3-Stage Agent Crew (Planner → Worker → Checker)**, mengelola eksekusi paralel untuk task-task independen, dan menjalankan gerbang verifikasi sebelum review.

---

## 1. Alur Kerja 3-Stage Agent Crew

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│     PLANNER     │ ────> │     WORKER      │ ────> │     CHECKER     │
│                 │       │                 │       │                 │
│ • Context Spec  │       │ • Isolated Git  │       │ • Pre-Flight    │
│ • TELOS Intent  │       │ • TDD Cycle     │       │ • QA & Audit    │
│ • Plan / DAG    │       │ • Clean Context │       │ • Review Report │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

1. **Stage 1: Planner (`agent-orchestration`)**:
   - Membaca kebutuhan bisnis, mendokumentasikan modul ke `docs/context/FEATURE_*.md` dengan format TELOS (Current State vs Ideal State).
   - Memecah pekerjaan ke dalam subtask atomik pada `docs/plans/*.md` dan mempublikasikannya ke papan NeoKanban.
2. **Stage 2: Worker (Spesialis Domain)**:
   - Didelegasikan ke peran spesifik (`frontend-specialist`, `backend-specialist`, `database-specialist`).
   - Menerapkan isolasi Git (`git checkout -b feat/...`).
   - Melakukan siklus **Red-Green-Refactor** untuk tiap langkah.
3. **Stage 3: Checker (`qa-tester` / `security-audit`)**:
   - Berperan sebagai auditor independen (tidak menulis fitur, melainkan memverifikasi).
   - Menjalankan test suites lengkap, edge case analysis, dan Trail of Bits security scan.
   - Menyiapkan ringkasan bukti pengujian objektif untuk diserahkan ke Safe Review Gate.

---

## 2. Pendelegasian Subagent dengan Konteks Bersih (Clean Context)

- **Instruction Budget**: Batasi prompt instruksi subagent agar padat (< 100 baris instruksi inti), mengacu pada standar `AGENTS.md`.
- **Target File Terisolasi**: Tentukan secara eksplisit daftar file yang boleh dibuat/diedit (`Files:` section).
- **Perintah Verifikasi Jelas**: Tentukan command testing spesifik yang harus dieksekusi subagent (`npm test -- <path>`).

---

## 3. Eksekusi Agen Paralel (Parallel Dispatching)

Jika terdapat 2 atau lebih task independen:
- **Syarat Paralelisasi**:
  - Task tidak menyentuh file yang sama (zero overlap).
  - Task tidak memiliki dependensi data atau urutan eksekusi.
  - Setiap task memiliki file pengujian terpisah.
- **Pencegahan Konflik**: Jika ada potensi sentuhan file bersama (misal `package.json`, skema database, router utama), jalankan task secara **sekuensial** demi integritas kode.
