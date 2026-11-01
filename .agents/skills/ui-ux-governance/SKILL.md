---
name: ui-ux-governance
description: UI consistency governance, design token integration, standard component reuse, accessible UI/UX standards (WCAG AA), and interactive visual previews.
---

# UI & UX Governance Skill

Gunakan skill ini saat merancang, membangun, atau memodifikasi antarmuka visual (frontend) untuk menjamin konsistensi token, penggunaan ulang template komponen, dan standar aksesibilitas premium.

---

## 1. Alur Pemeriksaan Tata Kelola UI

```
[Permintaan UI Baru]
        │
        ▼
1. Pengecekan Design Token (`kanban tokens:check`)
   ├── [Ada] ──► Tarik ke lokal (`kanban tokens:pull` -> docs/ui-governance/token-design.json)
   └── [Belum Ada] ──► Buat token dari template (`kanban tokens:push`)
        │
        ▼
2. Pengecekan Template Komponen (`kanban component:check <nama>`)
   ├── [Ada] ──► Gunakan komponen teruji di docs/ui-governance/components/
   └── [Belum Ada] ──► Sintesis mandiri via `kanban component:new <nama>`
        │
        ▼
3. Review Visual & Persetujuan Pengguna
   └── Publikasikan ke NeoKanban (`kanban component:publish <path>`)
```

---

## 2. Perintah CLI UI Governance

```powershell
# Cek ketersediaan token di papan NeoKanban
npx tsx scripts/kanban.ts tokens:check

# Tarik token dari NeoKanban ke lokal
npx tsx scripts/kanban.ts tokens:pull

# Unggah token lokal ke NeoKanban
npx tsx scripts/kanban.ts tokens:push

# Cek ketersediaan komponen tertentu
npx tsx scripts/kanban.ts component:check <nama-komponen>

# Sintesis komponen baru sesuai standar token
npx tsx scripts/kanban.ts component:new <nama-komponen>

# Publikasikan komponen yang disetujui ke NeoKanban
npx tsx scripts/kanban.ts component:publish docs/ui-governance/components/template-<nama>.html

# Query Design Intelligence UI/UX Pro Max (styles, colors, fonts, UX guidelines, charts)
npx tsx scripts/kanban.ts ui:search "<query>" [--domain <style|color|typography|ux|chart|icons>]

# Hasilkan rekomendasi Design System lengkap untuk proyek/halaman baru
npx tsx scripts/kanban.ts ui:design "<produk/industri/kata-kunci>"
```

---

## 3. Standar Desain UX/UI Pro Max

1. **Aksesibilitas WCAG AA**:
   - Rasio kontras teks minimal 4.5:1 untuk teks biasa, 3:1 untuk teks besar.
   - Tag HTML semantik (`<nav>`, `<main>`, `<button>`, `<section>`).
   - `aria-label` wajib untuk tombol yang hanya menggunakan ikon.
2. **State Interaktivitas Lengkap**:
   - Setiap elemen tombol/input harus mendukung 6 state: Default, Hover, Active/Press, Focus-Visible, Disabled, dan Loading.
3. **Motion & Micro-interactions**:
   - Transisi durasi 150ms–300ms dengan timing function `cubic-bezier(0.16, 1, 0.3, 1)`.
   - Hindari animasi berlebihan yang mengganggu performa atau aksesibilitas.
