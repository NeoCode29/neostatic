# Database Schema & Data Models

---

## 1. Konfigurasi Mesin Database

- **Tipe Database**: [PostgreSQL / MySQL / SQLite]
- **ORM / Query Builder**: [Prisma / Drizzle / TypeORM / Kysely]
- **Strategi Migrasi**: [Declarative migrations via CLI]

---

## 2. Entitas & Relasi Data (ERD Ringkas)

```
[User] 1 ──── N [Project] 1 ──── N [Task]
                  │
                  └──── 1 [Configuration]
```

### Definisi Tabel Utama:
- **`users`**: Menyimpan identitas akun, role, dan kredensial.
- **`projects`**: Menyimpan metadata ruang kerja dan konfigurasi papan.
- **`tasks`**: Menyimpan item pekerjaan, relasi assignee, kolom status, dan checklist.

---

## 3. Aturan Integritas Data

1. **Foreign Key Constraints**: Selalu definisikan relasi referensial dengan aturan `ON DELETE CASCADE` atau `ON DELETE RESTRICT` yang eksplisit.
2. **Indexing**: Buat indeks pada kolom foreign key dan kolom yang sering dicari / difilter (misal `status`, `created_at`, `email`).
3. **Data Types**: Gunakan tipe data paling tepat (misal UUID / CUID untuk ID, `TIMESTAMPTZ` untuk waktu dengan zona waktu).
