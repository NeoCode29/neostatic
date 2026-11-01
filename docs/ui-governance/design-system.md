# Editorial Design System

> **Versi**: 1.1.0  
> **Status**: Living Single Source of Truth  
> **Standar Aksesibilitas**: WCAG AA Compliance (Kontras Min. 4.5:1, Focus Rings, Keyboard Accessible)  
> **Arsitektur**: W3C Design Tokens & Component Registry Terintegrasi NeoKanban

---

## 1. Filosofi & Karakter Visual

Editorial Design System dirancang dengan pendekatan **Warm High-End Editorial Minimalism**—menggabungkan keanggunan tipografi majalah cetak modern dengan kenyamanan dan presisi antarmuka digital kontemporer.

### Prinsip Utama:
1. **Warm Canvas & Soft Surfaces**:
   - Menghindari warna putih polos yang menyilaukan (*stark white*). Menggunakan kanvas bernuansa hangat `#FAF8F5` dengan kartu putih bersih `#FFFFFF` bertepi halus (`#EAE6DF`) dan bayangan organik multi-layer.
2. **Harmoni Tipografi Serif & Sans**:
   - Judul dan tajuk display menggunakan **Playfair Display / Serif** untuk karakter premium.
   - Antarmuka fungsional, label, dan data tabular menggunakan **Plus Jakarta Sans / Inter** yang tajam, sangat mudah dibaca (*high legibility*), dan bersih.
3. **Pill & Organic Geometry**:
   - Bentuk kapsul/pill (`rounded-full`) dan sudut lengkung lembut (`rounded-2xl` atau `rounded-3xl`) mendominasi komponen tombol, tag, segmented control, dan input pencarian.
4. **Micro-Interactions yang Halus (150–250ms)**:
   - Seluruh elemen interaktif memiliki feedback instan: perpindahan posisi halus (`-translate-y-0.5`), penegasan focus-visible ring, dan transisi cubic-bezier yang tenang.

---

## 2. Design Tokens Reference (`token-design.json`)

### A. Palet Warna Semantik
| Token | Nilai Hex / RGB | Kegunaan |
| :--- | :--- | :--- |
| `canvas.DEFAULT` | `#FAF8F5` | Latar belakang kanvas utama (Warm Off-White) |
| `surface.DEFAULT` | `#FFFFFF` | Latar permukaan kartu (Bento Grid Card) |
| `surface.soft` | `#F4F1EC` | Latar sekunder, hover area, pill containers |
| `primary.DEFAULT` | `#1C1917` | Tombol utama, teks judul, dark pill |
| `primary.foreground` | `#FAF8F5` | Teks di atas warna primary |
| `accent.terracotta` | `#E25822` | Badge 'ALL', indikator aktif, aksen energik |
| `accent.gold` | `#EAB308` | Status tier badge 'GOLD', star ratings |
| `accent.cream` | `#EFECE6` | Tombol soft beige, container netral |
| `muted.DEFAULT` | `#78716C` | Teks sekunder, label pembantu, placeholder |
| `border.DEFAULT` | `#EAE6DF` | Garis tepi kartu dan input yang halus |
| `border.focused` | `#1C1917` | Focus ring saat elemen aktif |

### B. Tipografi
- **Serif Display**: `'Playfair Display', Georgia, serif`
- **Functional Sans**: `'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif`
- **Code / Monospace**: `'JetBrains Mono', Menlo, monospace`

### C. Radius Sudut
- `rounded-full` (`9999px`): Tombol pill, badges, search bar, segmented control, breadcrumb.
- `rounded-2xl` (`16px`): Kartu komponen kecil, cell cards, accordion.
- `rounded-3xl` (`24px`): Kartu container bento grid utama.

---

## 3. Katalog Komponen & Panduan Penggunaan

### 1. Buttons Suite
Koleksi tombol fleksibel dengan hierarki aksi yang tegas:
- **Primary Solid Pill**: Latar hitam pekat `#1C1917`, teks putih, padding `px-6 py-2.5`, hover scale & lift.
- **Outlined Pill**: Latar putih, border tipis `#1C1917`, teks hitam kontras tinggi.
- **Warm Beige Pill**: Latar cream `#EFECE6`, teks `#1C1917`, cocok untuk aksi sekunder.
- **Circular Icon Button**: Tombol bulat (dropdown caret, hamburger, panah kanan `→`).

```html
<!-- Primary Pill Button -->
<button class="px-6 py-2.5 rounded-full bg-stone-900 text-stone-50 text-sm font-medium hover:bg-stone-800 transition-all shadow-sm">
  Button
</button>

<!-- Outlined Pill Button -->
<button class="px-6 py-2.5 rounded-full bg-white border border-stone-900 text-stone-900 text-sm font-medium hover:bg-stone-50 transition-all">
  Button
</button>
```

---

### 2. Tags & Badges
Indikator taksonomi dan filter cepat:
- **Active Pill Badge**: Latar oranye terakota `#E25822` dengan teks putih (contoh: `ALL`).
- **Subtle Moodboard Badge**: Latar `#F4F1EC`, teks abu-abu gelap dengan padding presisi.
- **Dropdown Filter Badge**: Teks label + icon chevron bawah (contoh: `Ratings ▾`).
- **Framed Category Badges**: Kotak tipis bernuansa vintage minimalis (contoh: `ART DECO`, `SILVER`).
- **Clear Filter Tag**: Label disertai tombol silang `×`.

---

### 3. Breadcrumbs ("Bread")
Kapsul navigasi hierarki halaman:
- Wadah pil `rounded-full` berwarna `#FFFFFF` atau `#F4F1EC`.
- Pemisah titik tengah (`·`) yang rapi antara level halaman.

```html
<nav class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-stone-200 text-xs font-medium text-stone-600">
  <a href="#" class="hover:text-stone-900">Home Page</a>
  <span class="text-stone-400">·</span>
  <span class="text-stone-900 font-semibold">Case Study Details</span>
</nav>
```

---

### 4. Accordion Interaktif
Elemen pengungkapan informasi progresif:
- **Collapsed State**: Judul tebal bernuansa editorial + tombol bulat `+` di sebelah kanan.
- **Expanded State**: Tombol bulat `-`, paragraf jawaban dengan sorotan tautan aksen oranye terakota.

---

### 5. Form Controls (Checkboxes, Radios, Sliders)
- **Checkboxes**: Kotak rounded `rounded-md`, mendukung status: *Checked*, *Indeterminate*, *Unchecked*, serta varian *Disabled*.
- **Radios**: Lingkaran dengan dot fokus internal, mendukung status: *Selected*, *Unselected*, serta varian *Disabled*.
- **Sliders**: Track minimalis tipis dengan jempol (*thumb*) interaktif yang memunculkan floating tooltip kapsul hitam bertuliskan `Value`.

---

### 6. Text Inputs & Search Bars
- **Desktop Search Bar with Budget Pill**: Input pencarian berbentuk kapsul penuh dengan icon loop di kiri dan dropdown kapsul internal `Budget ▾` di sisi kanan.
- **Mobile Search Bar**: Input pencarian kompak dengan tombol filter icon di sampingnya.
- **Form Select Field**: Input bertipe dropdown dengan chevron bawaan.
- **Clean Text Input**: Bidang input dengan latar halus `#F4F1EC` tanpa border tebal untuk form minimalis.

---

### 7. Info Blocks
Kotak pesan informatif dengan icon checklist bulat hitam di sebelah kiri, diikuti judul semi-bold dan deskripsi penjelasan yang informatif.

---

### 8. Badges Pembayaran & Bendera
- **Payments**: Kumpulan logo penyedia pembayaran (*Visa, Mastercard, Stripe, PayPal, Apple Pay, Klarna*) dalam wadah terstandarisasi.
- **Flags**: Chip bendera multi-negara (*AU, US, UK, CA, JP, IT, BR, IE, FR, DE, EU*) dengan tepi halus.

---

### 9. Cells & Profile Cards
Komponen baris/kartu data terstruktur:
- **Promotion Cell**: Icon ilustrasi kotak + teks tanggal promo + tombol navigasi lingkaran `→`.
- **Jane Cooper Profile Card**: Foto avatar profil dengan badge `GOLD`, bintang ulasan (5 stars), nama desainer, lokasi & status ketersediaan, serta label tarif `$599 /hr`.

---

### 10. Segmented Controls
Pengalih mode tampilan berbasis kapsul:
- **Icon Switcher**: Mengalihkan antara mode *Grid* dan *List*.
- **Multi-Tab Pill**: Kapsul lonjong dengan pilihan `[ Label | Label | Label ]` di mana tab aktif memiliki latar hitam tegas.

---

### 11. Profile Image with Gold Status
Foto profil portret bulat/melengkung dengan lencana *pill* emas `GOLD` yang menempel di bagian bawah avatar.

---

### 12. Charts & Data Visualizations Suite
Visualisasi data native SVG tanpa dependensi library eksternal (Zero Heavy Dependencies) yang responsif dan selaras dengan palet token semantik:
- **KPI Sparklines Banner**: Kartu metrik ringkas dengan garis kurva SVG mikro dan persentase tren pergerakan (`+24.8%`).
- **Area / Line Chart (Velocity Trend)**:
  - Kurva halus (*smooth cubic bezier*) dengan gradient fill `url(#editorialAreaGrad)` di bawah kurva.
  - Sumbu horizontal bulan/minggu, garis grid putus-putus (`stroke-dasharray="4 4"`), dan penanda titik data interaktif berlingkar ganda.
- **Donut Chart (Tasks Breakdown)**:
  - Lingkaran cincin stroke SVG berputar (`transform -rotate-90`) dengan kalkulasi keliling `stroke-dasharray` untuk membagi proporsi modul (*Frontend 45%, Backend 35%, QA 20%*).
  - Teks metrik pusat besar (88% Done) dan label legenda semantik di bawahnya.
- **Weekly Activity Bar Chart**:
  - Batang vertikal dengan sudut atas melengkung (`rounded-t-xl`), penyorotan batang hari puncak (*highlight current peak*), dan label singkatan hari (*Mon, Tue, Wed, Thu, Fri, Sat, Sun*).

---

## 4. Standar Operasional Prosedur (SOP Tata Kelola)

Setiap komponen baru yang ditambahkan ke sistem wajib melewati 4 gerbang verifikasi:
1. **Token Compliance**: Seluruh warna, ukuran font, margin, dan border wajib merujuk pada `token-design.json`. Dilarang menggunakan nilai warna *hardcoded* acak.
2. **Aksesibilitas (WCAG AA)**:
   - Rasio kontras teks terhadap latar belakang minimal **4.5:1** (dan 3:1 untuk teks besar).
   - Seluruh elemen interaktif wajib memiliki focus ring yang jelas saat dinavigasi menggunakan tombol `Tab`.
   - Elemen grafik visualisasi data wajib memiliki atribut `role="img"` dan `aria-label` deskriptif.
3. **Penyimpanan Template**: Komponen disimpan sebagai berkas modular mandiri di folder `docs/ui-governance/components/template-[nama].html`.
4. **Registrasi NeoKanban**: Publikasikan ke Living Context NeoKanban menggunakan perintah:
   ```powershell
   npx tsx scripts/kanban.ts component:publish docs/ui-governance/components/template-[nama].html
   ```

