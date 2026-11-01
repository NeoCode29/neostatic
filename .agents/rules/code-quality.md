# Code Quality & Engineering Discipline Rules

## 1. Disiplin TDD (Test-Driven Development)
- **Siklus RED-GREEN-REFACTOR**:
  1. **RED**: Tulis unit test / integration test yang gagal terlebih dahulu. Jalankan test untuk membuktikan kegagalan.
  2. **GREEN**: Tulis implementasi kode seminimal mungkin hingga test lulus.
  3. **REFACTOR**: Rapikan kode, buang duplikasi, dan pastikan test tetap 100% lulus.
- Dilarang menulis implementasi logika kompleks sebelum ada pengujian otomatis.

## 2. Isolasi Ruang Kerja Git
- **Larangan Commit Langsung ke Master/Main**: Semua pengerjaan fitur atau perbaikan bug harus dilakukan pada branch fitur (`feat/...`, `fix/...`) atau git worktree terisolasi.
- **Whole-Branch Verification**: Sebelum merge ke branch utama, jalankan seluruh test suite (`npm test`) dan build verification untuk memastikan tidak ada regresi.

## 3. Kesederhanaan & Kebersihan Kode
- **YAGNI (You Aren't Gonna Need It)**: Hindari over-engineering, abstraksi berlebihan, dan dependency yang tidak perlu.
- **Komentar Efektif**: Hindari komentar basi yang hanya mengulang fungsi kode. Gunakan penamaan variabel/fungsi yang deklaratif dan self-explanatory.
- **Security & Integrity**: Jangan pernah melakukan hardcode secret, API key, atau token ke dalam kode sumber.
