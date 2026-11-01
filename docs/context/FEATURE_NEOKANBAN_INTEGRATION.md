# Feature Context: NeoKanban Ecosystem Alignment

> Dokumen spesifikasi fitur tingkat modul (Single Source of Truth) berbasis **TELOS Intent Alignment** untuk menyelaraskan `harnes-neokanban` dengan ekosistem dan kapabilitas terbaru NeoKanban.

---

## 1. Ikhtisar Fitur & TELOS Intent

- **Nama Modul**: NeoKanban Ecosystem Full Alignment (UI/UX Studio, Skill Library, Living Context, & Review Annotations)
- **Target Pengguna / Peran**: Developer, AI Agent (Antigravity), UI/UX Specialist, Reviewer
- **Current State (Kondisi Saat Ini)**:
  - CLI `kanban.ts` sebelumnya hanya menangani sinkronisasi dasar dokumen konteks dan mengunggah komponen UI sebagai berkas konteks generik.
  - Belum terhubung dengan entitas kelas satu (**First-Class Entities**) NeoKanban terbaru: `UiPage` dan `UiComponent` di UI/UX Studio.
  - Agen AI belum dapat melihat anotasi review visual (pin & bounding box) yang ditinggalkan reviewer pada canvas UI Studio.
  - Belum ada perintah CLI untuk menjelajah dan mengunduh paket skill dari katalog **NeoKanban Skill Library** ke direktori lokal `.agents/skills/`.
- **Ideal State (Kondisi Sukses)**:
  - CLI `kanban.ts` mendukung integrasi penuh dengan API UI/UX Studio:
    1. `studio:components:push` / `component:publish`: Menerbitkan template HTML langsung sebagai `UiComponent` di UI/UX Studio NeoKanban (dengan nama, kategori, deskripsi, dan HTML).
    2. `studio:components:pull`: Menarik komponen dari UI/UX Studio ke direktori lokal `docs/ui-governance/components/`.
    3. `studio:pages:push` / `studio:pages:pull`: Sinkronisasi mockup prototipe halaman (`UiPage`) antara repositori lokal dan UI/UX Studio.
    4. `studio:annotations` (alias `ui:annotations`): Menampilkan daftar pin review & isu visual aktif dari canvas UI Studio agar agen dapat mengeksekusi perbaikan sesuai feedback pengguna.
    5. `skills:list` & `skills:pull`: Menjelajah katalog skill NeoKanban dan menginstal skill ke `.agents/skills/<slug>/`.
    6. Penyelarasan Living Context multi-berkas dua arah yang tangguh dan tahan kegagalan (*fault-tolerant*).

---

## 2. Kebutuhan Fungsional & Kriteria Pembuktian (Falsifiable Verification)

- [ ] **Kriteria 1 (UI Studio Components)**: Fungsi `publishUiComponent` dan `pullUiComponents` berhasil berkomunikasi dengan endpoint `/api/boards/[id]/ui-components`, memetakan template HTML lokal, dan menyimpan ke board secara upsert (create or update).
- [ ] **Kriteria 2 (UI Studio Pages)**: Fungsi `pushUiPage` dan `pullUiPages` berhasil mengelola berkas prototipe halaman via `/api/boards/[id]/ui-pages`.
- [ ] **Kriteria 3 (Review Annotations Feed)**: Perintah `ui:annotations` dapat mengambil seluruh anotasi bertipe `PIN` atau `BOX` berstatus `OPEN` dari `/api/ui-annotations`, memformatnya dengan koordinat, komentar, dan nama halaman/komponen target.
- [ ] **Kriteria 4 (Skill Library Sync)**: Fungsi `listSkills` dan `pullSkill` mampu membaca daftar skill dari `/api/skills` dan mengunduh manifest/berkas ke `.agents/skills/<slug>/`.
- [ ] **Kriteria 5 (Resilience & 100% Tests)**: Semua fungsi baru memiliki unit test di `scripts/test-kanban.ts` yang lulus 100% dan menangani kasus offline/API error dengan graceful fallback.

---

## 3. Skema Data & Model Terkait (NeoKanban Core)

- **Entitas UI Component**: `UiComponent`
  - `id`: CUID
  - `boardId`: CUID (Relasi ke Board)
  - `name`: String (e.g. "Invoice Status Badge")
  - `category`: String ("INPUT" | "NAVIGATION" | "FEEDBACK" | "CARD" | "DATA_DISPLAY" | "LAYOUT" | "GENERAL")
  - `description`: String?
  - `htmlContent`: Text (Max 2MB)
  - `order`: Int
- **Entitas UI Page**: `UiPage`
  - `id`: CUID
  - `boardId`: CUID
  - `title`: String
  - `path`: String (e.g. "/invoices/new")
  - `category`: String
  - `htmlContent`: Text
  - `order`: Int
- **Entitas UI Annotation**: `UiAnnotation`
  - `id`: CUID
  - `pageId` / `componentId`: CUID?
  - `type`: "PIN" | "BOX"
  - `posX`, `posY`: Float (persentase koordinat canvas)
  - `width`, `height`: Float?
  - `comment`: Text
  - `status`: "OPEN" | "RESOLVED"
  - `cardId`: CUID? (Relasi jika dikonversi menjadi task Kanban)

---

## 4. Kontrak API NeoKanban Terkait

| Method | Endpoint Path | Auth Guard | Payload Ringkas | Response Sukses |
| :---: | :--- | :---: | :--- | :--- |
| `GET` | `/api/boards/[id]/ui-components` | Bearer PAT | - | `{ "components": [...] }` |
| `POST` | `/api/boards/[id]/ui-components` | Bearer PAT | `{ name, category, htmlContent, description }` | `{ "component": { ... } }` |
| `PUT` | `/api/boards/[id]/ui-components/[id]` | Bearer PAT | `{ name?, category?, htmlContent?, description? }` | `{ "component": { ... } }` |
| `GET` | `/api/boards/[id]/ui-pages` | Bearer PAT | - | `{ "pages": [...] }` |
| `POST` | `/api/boards/[id]/ui-pages` | Bearer PAT | `{ title, path, category, htmlContent }` | `{ "page": { ... } }` |
| `GET` | `/api/ui-annotations?pageId=...` | Bearer PAT | - | `{ "annotations": [...] }` |
| `GET` | `/api/skills` | Bearer PAT | - | `{ "skills": [...] }` |
| `GET` | `/api/skills/[id]` | Bearer PAT | - | `{ "skill": { ... } }` |

---

## 5. Berkas Terlibat

- **CLI Engine**: [`scripts/kanban.ts`](file:///c:/Users/kresna/Documents/harnes/harnes-neokanban/scripts/kanban.ts)
- **Suite Pengujian**: [`scripts/test-kanban.ts`](file:///c:/Users/kresna/Documents/harnes/harnes-neokanban/scripts/test-kanban.ts)
- **Komponen & Template Lokal**: `docs/ui-governance/components/` & `docs/ui-governance/pages/`
- **Living Context Docs**: [`docs/context/INDEX.md`](file:///c:/Users/kresna/Documents/harnes/harnes-neokanban/docs/context/INDEX.md)
- **Panduan Operasional**: [`HARNESS.md`](file:///c:/Users/kresna/Documents/harnes/harnes-neokanban/HARNESS.md) & [`AGENTS.md`](file:///c:/Users/kresna/Documents/harnes/harnes-neokanban/AGENTS.md)

---

## 6. Alur Interaksi Pengguna & Agen

1. **Sinkronisasi Desain UI Studio**:
   - Developer/Agen mendesain template komponen di `docs/ui-governance/components/template-badge.html`.
   - Menjalankan `npx tsx scripts/kanban.ts studio:components:push` untuk mempublikasikan langsung ke canvas UI/UX Studio NeoKanban.
2. **Review & Anotasi Visual**:
   - Reviewer membuka tab **UI/UX Studio** di browser, menempatkan pin koreksi visual pada prototipe.
   - Agen menjalankan `npx tsx scripts/kanban.ts ui:annotations` untuk mengambil feedback visual reviewer, lalu melakukan perbaikan kode secara presisi.
3. **Pemanfaatan Skill Library**:
   - Agen memeriksa skill pendukung via `npx tsx scripts/kanban.ts skills:list`.
   - Mengunduh paket instruksi spesialis via `npx tsx scripts/kanban.ts skills:pull <slug>`.

