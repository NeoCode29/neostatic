# Agent Roles & Specialist Delegation Matrix

---

## 1. Prinsip Orkestrasi Agen

1. **One Task, One Agent**: Setiap task dari kartu NeoKanban didelegasikan kepada peran spesialis yang tepat dengan batas lingkup file yang jelas.
2. **Clean Context Delegation**: Subagent bekerja dengan konteks yang bersih tanpa riwayat obrolan panjang yang membingungkan.
3. **Two-Stage Review**: Setiap penyelesaian tugas melalui audit pemenuhan spesifikasi dan kualitas kode sebelum diajukan ke review pengguna.

---

## 2. Matriks Spesialis Domain

| Spesialis | Tanggung Jawab Utama | Rujukan Aturan |
| :--- | :--- | :--- |
| **`ux-ui-pro-max`** | Desain antarmuka premium, token konsistensi, WCAG AA, audit gatekeeper | `.agents/specialists/ux-ui-pro-max.md` |
| **`frontend-specialist`** | Komponen UI, integrasi state, formulir interaktif, responsive design | `.agents/specialists/frontend-specialist.md` |
| **`backend-specialist`** | REST API, routing, integrasi auth, validasi skema request/response | `.agents/specialists/backend-specialist.md` |
| **`database-specialist`** | Pemodelan relasi, migrasi skema, indeks query, integritas data | `.agents/specialists/database-specialist.md` |
| **`debugger-specialist`** | Error tracing, reproduksi bug minimal, isolasi akar masalah 4-fase | `.agents/specialists/debugger-specialist.md` |
| **`qa-tester`** | Test suite otomatis, TDD edge-case hardening, boundary conditions | `.agents/specialists/qa-tester.md` |

---

## 3. Protokol Penugasan Task

Pada setiap rencana markdown (`docs/plans/`), cantumkan baris spesialis yang ditugaskan:
```markdown
### Task 1: Bangun Modul Autentikasi
**Agent:** backend-specialist
**Priority:** HIGH
```
