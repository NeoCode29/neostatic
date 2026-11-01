# Security Policy & Validation Standards - Neostatic

---

## 1. Prinsip Utama Keamanan Deployment Statis
Sistem Neostatic menerima file arsip dari pengguna luar. Oleh karena itu, prinsip **Zero-Trust Input** diterapkan pada setiap file yang masuk.

---

## 2. Aturan Validasi Keamanan (Security Checklist)

### A. Validasi Slug URL (`<nama-halaman>`)
- Karakter yang diperbolehkan hanya huruf latin, angka, strip, dan garis bawah:
  `^[a-zA-Z0-9_-]{3,64}$`
- Dilarang keras mengandung karakter path traversal seperti `..`, `/`, `\`, atau spasi.

### B. Anti Zip-Slip (Path Traversal Guard)
- Menggunakan Rust `zip::read::ZipFile::enclosed_name()`.
- Setiap file path yang didekompresi harus divalidasi strictly berada di dalam root folder ekstrak target.
- Jika ada relative path berbahaya (`../../etc/passwd` atau symlink liar), proses ditolak seketika dan dibatalkan.

### C. Extension Allowlist
Hanya file berformat statis yang diizinkan untuk diekstrak:
- **Dokumen Web**: `.html`, `.htm`, `.css`, `.js`, `.mjs`, `.map`, `.json`, `.xml`, `.txt`
- **Gambar & Ikon**: `.png`, `.jpg`, `.jpeg`, `.webp`, `.gif`, `.svg`, `.ico`
- **Font**: `.woff`, `.woff2`, `.ttf`, `.otf`, `.eot`
- **Audio/Video Statis**: `.mp3`, `.mp4`, `.webm`, `.ogg`

**Dilarang Keras**:
- Script server: `.php`, `.phtml`, `.cgi`, `.py`, `.sh`, `.bash`, `.pl`, `.rb`
- Binary/Executable: `.exe`, `.dll`, `.so`, `.bin`, `.bat`, `.cmd`
- File Konfigurasi & Lingkungan: `.env`, `.htaccess`, `.htpasswd`, `.git`, `.gitignore`

### D. Zip Bomb & DoS Protection
- **Maksimal Ukuran File ZIP Upload**: 50 MB
- **Maksimal Ukuran Total Setelah Dekompresi**: 150 MB
- **Maksimal Jumlah File**: 2.500 file
- **Compression Ratio Guard**: Jika rasio kompresi melebihi 100:1, reject seketika.

### E. Validasi Konten Minimal
- File arsip wajib memiliki setidaknya satu file `index.html` di tingkat root.

---

## 3. Isolasi di Tingkat Web Server (Nginx)
1. **Disable Server-Side Script Engine**: Nginx dikonfigurasi murni melayani file statis (`try_files $uri $uri/ =404`).
2. **Deny Access to Hidden & System Files**:
   ```nginx
   location ~* \.(php|sh|py|cgi|env|git|htaccess)$ {
       deny all;
       return 404;
   }
   ```
3. **Security Headers**:
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `Referrer-Policy: strict-origin-when-cross-origin`
