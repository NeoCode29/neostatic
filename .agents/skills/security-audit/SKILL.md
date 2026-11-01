---
name: security-audit
description: Trail of Bits-inspired security auditing skill. Covers AST-based SAST (Semgrep), dependency supply-chain auditing, fail-open/insecure defaults detection, secret hunting, and pre-release verification.
---

# Trail of Bits Security Audit Skill

Gunakan skill ini untuk menjalankan audit keamanan kode secara menyeluruh mengadopsi metodologi rekayasa keamanan **Trail of Bits**: analisis statis AST (Semgrep), audit rantai pasok dependensi (*supply chain*), pendeteksian nilai bawaan tidak aman (*insecure defaults / fail-open*), pencarian kebocoran rahasia (*secret hunting*), dan validasi patch kerentanan.

---

## 1. Prinsip Utama Audit (Trail of Bits Rigor)

1. **Privasi & Telemetri Off**: Setiap kali menjalankan scanner keamanan (seperti Semgrep), wajib menyertakan flag `--metrics=off` untuk mencegah kebocoran data kode audit ke server eksternal.
2. **Pahami Arsitektur Dahulu (Audit Context Building)**: Pahami aliran data eksternal, titik masuk (*entry points*), dan batas trust boundary sebelum mencari celah keamanan (*no guesswork*).
3. **Pemberantasan Insecure Defaults (Fail-Closed Principle)**: Seluruh konfigurasi, otorisasi, dan validasi harus bersikap menolak secara default (*fail-closed*), bukan mengizinkan secara default (*fail-open*).
4. **Supply Chain Vigilance**: Jangan hanya mengecek CVE yang ada di database; periksa juga script instalasi paket (`preinstall`, `postinstall`), paket tak terawat (*abandoned*), dan potensi serangan *typosquatting*.
5. **Verifikasi Positif Palsu (False Positive Gate)**: Setiap temuan scanner harus divalidasi dengan alur eksploitasi nyata atau pengujian unit minimal sebelum dilaporkan.

---

## 2. Empat Pilar Audit Keamanan

### Pilar 1: Analisis Statis Kode (SAST via Semgrep / ESLint Security)
- **Tujuan**: Mendeteksi pola kelemahan kode umum (OWASP Top 10, CWE).
- **Cakupan Pemeriksaan**:
  - SQL / NoSQL Injection (penggunaan parameterized query vs concatenations).
  - Cross-Site Scripting / XSS (raw HTML injection, unescaped output).
  - Path Traversal (manipulasi input jalur berkas `../`).
  - Server-Side Request Forgery (SSRF) pada pemanggilan URL luar.
  - Insecure Deserialization & Prototype Pollution.
- **Perintah Audit**:
  ```powershell
  # Jika semgrep terpasang:
  semgrep scan --config auto --metrics=off
  ```

### Pilar 2: Audit Rantai Pasok Dependensi (Supply Chain Risk)
- **Tujuan**: Menghindari dependensi jahat atau rentan.
- **Cakupan Pemeriksaan**:
  - Paket dengan kerentanan CVE kritis / tinggi.
  - Skrip instalasi otomatis (`preinstall` / `postinstall`) yang mencurigakan.
  - Dependensi tak terawat atau memiliki reputasi rendah.
- **Perintah Audit**:
  ```powershell
  # Node.js / npm:
  npm audit --audit-level=high

  # Python (jika ada):
  pip-audit
  ```

### Pilar 3: Insecure Defaults & Footgun Detection
- **Tujuan**: Menemukan konfigurasi berbahaya yang lolos pengujian fungsional.
- **Checklist Verifikasi**:
  - [ ] **Permissive CORS**: Apakah CORS menggunakan wildcard `Access-Control-Allow-Origin: *` pada endpoint sensitif?
  - [ ] **SSL / TLS Verification**: Apakah ada flag penonaktifan sertifikat seperti `rejectUnauthorized: false` atau `verify=False`?
  - [ ] **Default Credentials**: Apakah sistem menggunakan username/password default atau dummy di lingkungan staging/prod?
  - [ ] **Debug / Verbose Errors**: Apakah stack trace mentah atau query database bocor ke respons pengguna saat error 500?

### Pilar 4: Secret Hunting & Kredensial Bocor
- **Tujuan**: Memastikan tidak ada rahasia yang ter-commit ke Git.
- **Pola yang Dilarang Keras di Kode**:
  - JWT Secrets, API Keys, Private Keys, Database Passwords.
  - File `.env` atau `.neokanban.json` yang tidak sengaja ter-track oleh Git (`git status`).

---

## 3. Checklist Verifikasi Gate Keamanan Sebelum Selesai

Sebelum kartu fitur frontend/backend dipindahkan ke kolom `Review`:

```markdown
### 🛡️ Security Audit Gate: PASSED
- [x] Zero Hardcoded Secrets (Checked against git diff)
- [x] Input Validation (Schema validation on all external parameters)
- [x] Fail-Closed Defaults (Proper error fallback, no disabled SSL/CORS wildcards)
- [x] Dependency Check (npm audit / pip-audit clean from critical CVEs)
- [x] Authorization Boundary Verified (Server-side permission guard active)
```
