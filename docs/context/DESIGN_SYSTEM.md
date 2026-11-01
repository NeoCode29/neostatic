# Design System Context

---

## 1. Single Source of Truth

Seluruh nilai token desain aplikasi (warna semantik, skala font, radius, dan spasi) bersumber dari:
- **Berkas Token Utama**: [`docs/ui-governance/token-design.json`](../ui-governance/token-design.json)
- **Komponen Standar**: [`docs/ui-governance/components/`](../ui-governance/components/)

---

## 2. Palet Warna Semantik

- **`canvas` / Background**: Warna latar belakang halaman utama.
- **`surface`**: Warna kontainer, kartu, modal, dan dropdown.
- **`primary`**: Warna aksi utama (tombol submit, badge aktif).
- **`muted`**: Warna teks sekunder, border halus, dan placeholder.
- **`accent`**: Warna penanda status atau sorotan penting.
- **`destructive`**: Warna peringatan bahaya, penghapusan, atau error.

---

## 3. Standar Tipografi & Aksesibilitas (WCAG AA)

1. **Rasio Kontras**: Minimal 4.5:1 untuk teks normal dan 3:1 untuk teks besar.
2. **6 Interactive States**: Setiap elemen kontrol harus mendukung state: Default, Hover, Active, Focus-Visible, Disabled, dan Loading.
3. **Touch Targets**: Minimal area interaksi 44×44px pada layar sentuh.
4. **Motion & Transitions**: Transisi halus berdurasi 150ms–300ms dengan timing `cubic-bezier(0.16, 1, 0.3, 1)`.

---

## 4. Mesin Desain UI/UX Pro Max

Gunakan CLI untuk mencari panduan gaya dan warna:
```powershell
npm run kanban -- ui:search "<kata-kunci>" --domain style
npm run kanban -- ui:design "<produk/industri>"
```
