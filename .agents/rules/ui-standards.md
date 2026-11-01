# UI Standards & Governance Rules

## 1. Single Source of Truth: Design Tokens
- Sebelum menulis styling antarmuka, periksa ketersediaan `docs/ui-governance/token-design.json`.
- Seluruh nilai warna semantik, jenis font, spasi (spacing), dan radius sudut harus merujuk pada token desain yang telah disepakati.

## 2. Pustaka & Template Komponen
- Periksa ketersediaan komponen standar di `docs/ui-governance/components/template-[nama].html` atau di papan NeoKanban sebelum membangun elemen baru.
- Jika komponen belum tersedia, rancang template mandiri dengan standar aksesibilitas, lalu simpan ke pustaka komponen.

## 3. Standar Aksesibilitas (WCAG AA) & Visual Excellence
- **Kontras Warna**: Pastikan kontras teks terhadap latar belakang memenuhi standar WCAG AA (minimal 4.5:1 untuk teks normal).
- **Interaktivitas Lengkap**: Setiap elemen interaktif wajib mendukung 6 state: Default, Hover, Active, Focus-Visible, Disabled, dan Loading.
- **Tipografi & Micro-Interactions**: Gunakan hierarki tipografi modern dan transisi halus (150–300ms cubic-bezier). Hindari tampilan flat atau mentah.
