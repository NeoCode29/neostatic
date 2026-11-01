# Repository Standards & Engineering Conventions

---

## 1. Strategi Branching Git

- **Branch Utama**: `main` atau `master` hanya berisi kode yang stabil dan teruji.
- **Larangan Commit Langsung**: Dilarang melakukan commit fitur atau fix langsung ke branch utama.
- **Konvensi Penamaan Branch**:
  - Fitur baru: `feat/<nama-fitur>`
  - Perbaikan bug: `fix/<nama-bug>`
  - Refaktor kode: `refactor/<nama-tugas>`

---

## 2. Format Pesan Commit

Gunakan standar Conventional Commits:
```
<type>(<scope>): <deskripsi singkat>

[body penjelasan jika diperlukan]
```
Contoh:
- `feat(auth): implement jwt token generation service`
- `fix(navbar): resolve mobile viewport overflow issue`
- `test(kanban): add unit test for card state transitions`

---

## 3. Disiplin Test-Driven Development (TDD)

1. **RED**: Tulis test yang gagal terlebih dahulu.
2. **GREEN**: Tulis implementasi kode sesederhana mungkin hingga test lulus.
3. **REFACTOR**: Bersihkan kode tanpa mengubah perilakunya, pastikan test tetap 100% hijau.
4. **Whole-Branch Verification**: Jalankan seluruh test suite (`npm test`) sebelum mengajukan review merge.
