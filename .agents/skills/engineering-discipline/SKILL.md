---
name: engineering-discipline
description: Engineering rigor including TDD (Red-Green-Refactor), Git branch/worktree isolation, 4-phase systematic debugging, and pre-completion verification.
---

# Engineering Discipline Skill

Gunakan skill ini untuk menegakkan disiplin rekayasa perangkat lunak: TDD, isolasi Git, investigasi bug sistematis, verifikasi menyeluruh, dan review kode.

---

## 1. Disiplin Test-Driven Development (TDD)

Siklus TDD wajib diterapkan untuk setiap penulisan fungsionalitas dan logika bisnis:
1. **Fase RED (Failing Test)**:
   - Buat file test unit atau integration test di folder pengujian.
   - Definisikan ekspektasi perilaku yang jelas.
   - Jalankan test dan pastikan test **gagal** karena fitur belum ada.
2. **Fase GREEN (Simplest Working Code)**:
   - Tulis kode implementasi fungsionalitas seminimal mungkin untuk membuat test berhasil lulus.
   - Jalankan test dan pastikan **100% lulus (hijau)**.
3. **Fase REFACTOR (Clean & Optimize)**:
   - Bersihkan duplikasi, rapikan struktur, pastikan konvensi penamaan seragam.
   - Jalankan kembali test suite untuk membuktikan refactor tidak merusak fungsi.

---

## 2. Isolasi Ruang Kerja Git (Branch & Worktree)

- Dilarang keras melakukan implementasi atau eksperimen langsung di branch `main` / `master`.
- Buat branch fitur baru untuk setiap task:
  ```powershell
  git checkout -b feat/<nama-fitur>
  ```
- Atau manfaatkan git worktree untuk pengerjaan terisolasi multi-task.
- Sebelum mengajukan merge, lakukan rebase atau verifikasi integrasi.

---

## 3. Investigasi Debugging Sistematis (4-Phase No Guesswork)

Jika terjadi kegagalan atau bug:
1. **Fase 1: Reproduksi Minimal**: Buat pengujian otomatis yang gagal secara konsisten untuk mereplikasi bug.
2. **Fase 2: Root-Cause Isolation**: Telusuri call stack, data payload, dan titik kegagalan aktual tanpa berspekulasi.
3. **Fase 3: Targeted Fix**: Lakukan perbaikan terfokus pada akar masalah yang teridentifikasi.
4. **Fase 4: Regression Check**: Jalankan seluruh test suite (`npm test`) untuk memastikan tidak ada efek samping.

---

## 4. Verifikasi Sebelum Selesai (Whole-Branch Verification)

Sebelum memindahkan kartu ke kolom `Review`:
1. Jalankan linter dan formatter jika tersedia.
2. Jalankan seluruh test suite (`npm test`).
3. Pastikan tidak ada berkas temporer atau log yang tertinggal di working tree (`git status`).
4. Siapkan laporan verifikasi terstruktur yang mencantumkan bukti hasil test untuk komentar review di NeoKanban.
