use std::collections::HashSet;
use std::io::{Read, Seek};
use std::sync::atomic::{AtomicU64, Ordering};
use regex::Regex;
use std::sync::LazyLock;
use thiserror::Error;

pub static BLOCKED_TRAVERSALS: AtomicU64 = AtomicU64::new(0);
pub static BLOCKED_FORBIDDEN: AtomicU64 = AtomicU64::new(0);

static SLUG_REGEX: LazyLock<Regex> = LazyLock::new(|| {
    Regex::new(r"^[a-zA-Z0-9_-]{3,64}$").expect("Invalid slug regex pattern")
});

static ALLOWED_EXTENSIONS: LazyLock<HashSet<&'static str>> = LazyLock::new(|| {
    let exts = [
        // Web Documents
        "html", "htm", "css", "js", "mjs", "map", "json", "xml", "txt",
        // Images & Icons
        "png", "jpg", "jpeg", "webp", "gif", "svg", "ico",
        // Fonts
        "woff", "woff2", "ttf", "otf", "eot",
        // Audio & Video
        "mp3", "mp4", "webm", "ogg",
    ];
    exts.into_iter().collect()
});

static FORBIDDEN_EXTENSIONS: LazyLock<HashSet<&'static str>> = LazyLock::new(|| {
    let exts = [
        "php", "phtml", "cgi", "py", "sh", "bash", "pl", "rb", "exe",
        "dll", "so", "bin", "bat", "cmd", "env", "htaccess", "htpasswd",
    ];
    exts.into_iter().collect()
});

#[derive(Error, Debug, PartialEq)]
pub enum SecurityError {
    #[error("Slug tidak valid '{0}'. Slug harus 3-64 karakter alfanumerik, tanda minus, atau underscore")]
    InvalidSlug(String),

    #[error("Potensi Zip Slip / Path Traversal terdeteksi pada file: '{0}'")]
    PathTraversal(String),

    #[error("File terlarang atau tersembunyi ditemukan: '{0}'")]
    ForbiddenFile(String),

    #[error("Ekstensi file '{0}' tidak diizinkan pada file: '{1}'")]
    DisallowedExtension(String, String),

    #[error("Total file dalam ZIP ({0}) melebihi batas maksimum ({1})")]
    TooManyFiles(usize, usize),

    #[error("Total ukuran uncompressed ({0} bytes) melebihi batas ({1} bytes)")]
    UncompressedSizeExceeded(u64, u64),

    #[error("Ukuran file '{0}' ({1} bytes) melebihi batas maksimum per file ({2} bytes)")]
    SingleFileSizeExceeded(String, u64, u64),

    #[error("Rasio kompresi terlalu ekstrem pada file '{0}' (Potensi Zip Bomb)")]
    ZipBombRatioExceeded(String),

    #[error("File wajib 'index.html' tidak ditemukan di root direktori ZIP")]
    MissingRootIndexHtml,

    #[error("Gagal membaca atau memproses format ZIP: {0}")]
    ZipReadError(String),
}

#[derive(Debug, Clone)]
pub struct SecurityConfig {
    pub max_file_count: usize,
    pub max_uncompressed_bytes: u64,
    pub max_single_file_bytes: u64,
    pub max_compression_ratio: f64,
}

impl Default for SecurityConfig {
    fn default() -> Self {
        Self {
            max_file_count: 2_500,
            max_uncompressed_bytes: 150 * 1024 * 1024, // 150 MB
            max_single_file_bytes: 50 * 1024 * 1024,    // 50 MB
            max_compression_ratio: 100.0,
        }
    }
}

#[derive(Debug, Clone)]
pub struct ZipInspectionReport {
    pub total_files: usize,
    pub total_uncompressed_bytes: u64,
    pub safe_file_paths: Vec<String>,
}

/// Memvalidasi format slug URL untuk subpath /staticpage/<slug>/
pub fn validate_slug(slug: &str) -> Result<(), SecurityError> {
    if !SLUG_REGEX.is_match(slug) {
        return Err(SecurityError::InvalidSlug(slug.to_string()));
    }
    Ok(())
}

/// Memeriksa seluruh isi arsip ZIP sebelum dilakukan ekstraksi ke disk
pub fn inspect_zip_archive<R: Read + Seek>(
    mut archive: zip::ZipArchive<R>,
    config: &SecurityConfig,
) -> Result<ZipInspectionReport, SecurityError> {
    let file_count = archive.len();
    if file_count > config.max_file_count {
        return Err(SecurityError::TooManyFiles(file_count, config.max_file_count));
    }

    let mut total_uncompressed: u64 = 0;
    let mut safe_files = Vec::with_capacity(file_count);
    let mut has_root_index_html = false;

    for i in 0..file_count {
        let file = archive
            .by_index(i)
            .map_err(|e| SecurityError::ZipReadError(e.to_string()))?;

        let raw_name = file.name().to_string();

        // 1. Perlindungan Zip-Slip / Path Traversal
        let enclosed_path = match file.enclosed_name() {
            Some(path) => path.to_path_buf(),
            None => {
                BLOCKED_TRAVERSALS.fetch_add(1, Ordering::Relaxed);
                return Err(SecurityError::PathTraversal(raw_name));
            }
        };

        // Pastikan tidak ada komponen '..' atau path absolut
        for component in enclosed_path.components() {
            match component {
                std::path::Component::ParentDir => {
                    BLOCKED_TRAVERSALS.fetch_add(1, Ordering::Relaxed);
                    return Err(SecurityError::PathTraversal(raw_name));
                }
                std::path::Component::RootDir | std::path::Component::Prefix(_) => {
                    BLOCKED_TRAVERSALS.fetch_add(1, Ordering::Relaxed);
                    return Err(SecurityError::PathTraversal(raw_name));
                }
                _ => {}
            }
        }

        // Jika direktori, lewati pengecekan ukuran file & ekstensi
        if file.is_dir() {
            continue;
        }

        // 2. Proteksi Zip Bomb & Batasan Ukuran
        let uncompressed_size = file.size();
        let compressed_size = file.compressed_size();

        if uncompressed_size > config.max_single_file_bytes {
            return Err(SecurityError::SingleFileSizeExceeded(
                raw_name,
                uncompressed_size,
                config.max_single_file_bytes,
            ));
        }

        total_uncompressed = total_uncompressed
            .checked_add(uncompressed_size)
            .ok_or_else(|| {
                SecurityError::UncompressedSizeExceeded(
                    u64::MAX,
                    config.max_uncompressed_bytes,
                )
            })?;

        if total_uncompressed > config.max_uncompressed_bytes {
            return Err(SecurityError::UncompressedSizeExceeded(
                total_uncompressed,
                config.max_uncompressed_bytes,
            ));
        }

        if compressed_size > 0 {
            let ratio = (uncompressed_size as f64) / (compressed_size as f64);
            if ratio > config.max_compression_ratio && uncompressed_size > 1024 * 1024 {
                return Err(SecurityError::ZipBombRatioExceeded(raw_name));
            }
        }

        // 3. Validasi Nama & Ekstensi File
        let file_stem_str = enclosed_path
            .file_name()
            .and_then(|f| f.to_str())
            .unwrap_or("");

        // Tolak file tersembunyi (dimulai dengan '.')
        if file_stem_str.starts_with('.') {
            BLOCKED_FORBIDDEN.fetch_add(1, Ordering::Relaxed);
            return Err(SecurityError::ForbiddenFile(raw_name));
        }

        // Dapatkan ekstensi file (lowercase)
        let ext = enclosed_path
            .extension()
            .and_then(|e| e.to_str())
            .map(|s| s.to_ascii_lowercase())
            .unwrap_or_default();

        if FORBIDDEN_EXTENSIONS.contains(ext.as_str()) {
            BLOCKED_FORBIDDEN.fetch_add(1, Ordering::Relaxed);
            return Err(SecurityError::ForbiddenFile(raw_name));
        }

        if !ALLOWED_EXTENSIONS.contains(ext.as_str()) {
            BLOCKED_FORBIDDEN.fetch_add(1, Ordering::Relaxed);
            return Err(SecurityError::DisallowedExtension(ext, raw_name));
        }

        // 4. Deteksi File Wajib index.html di root
        let normalized_path = enclosed_path.to_string_lossy().replace('\\', "/");
        if normalized_path == "index.html" || normalized_path == "./index.html" {
            has_root_index_html = true;
        }

        safe_files.push(normalized_path);
    }

    if !has_root_index_html {
        return Err(SecurityError::MissingRootIndexHtml);
    }

    Ok(ZipInspectionReport {
        total_files: safe_files.len(),
        total_uncompressed_bytes: total_uncompressed,
        safe_file_paths: safe_files,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Cursor, Write};
    use zip::write::{SimpleFileOptions, ZipWriter};

    fn create_test_zip(files: Vec<(&str, &[u8])>) -> Cursor<Vec<u8>> {
        let mut buf = Cursor::new(Vec::new());
        {
            let mut zip = ZipWriter::new(&mut buf);
            let options = SimpleFileOptions::default();

            for (name, content) in files {
                zip.start_file(name, options).unwrap();
                zip.write_all(content).unwrap();
            }
            zip.finish().unwrap();
        }
        buf.set_position(0);
        buf
    }

    #[test]
    fn test_valid_slugs() {
        assert!(validate_slug("landing-page").is_ok());
        assert!(validate_slug("portfolio_2026").is_ok());
        assert!(validate_slug("app-v1").is_ok());
    }

    #[test]
    fn test_invalid_slugs() {
        assert!(validate_slug("ab").is_err()); // too short
        assert!(validate_slug("../hack").is_err()); // path traversal
        assert!(validate_slug("my page").is_err()); // space
        assert!(validate_slug("site!@#").is_err()); // special chars
    }

    #[test]
    fn test_valid_zip_archive() {
        let zip_buf = create_test_zip(vec![
            ("index.html", b"<!DOCTYPE html><html><body><h1>Hello</h1></body></html>"),
            ("assets/style.css", b"body { background: #000; }"),
            ("assets/app.js", b"console.log('ready');"),
        ]);

        let config = SecurityConfig::default();
        let archive = zip::ZipArchive::new(zip_buf).unwrap();
        let report = inspect_zip_archive(archive, &config);

        assert!(report.is_ok());
        let rep = report.unwrap();
        assert_eq!(rep.total_files, 3);
    }

    #[test]
    fn test_missing_index_html() {
        let zip_buf = create_test_zip(vec![
            ("style.css", b"body { color: red; }"),
            ("app.js", b"console.log('test');"),
        ]);

        let config = SecurityConfig::default();
        let archive = zip::ZipArchive::new(zip_buf).unwrap();
        let res = inspect_zip_archive(archive, &config);

        assert_eq!(res.unwrap_err(), SecurityError::MissingRootIndexHtml);
    }

    #[test]
    fn test_reject_forbidden_php() {
        let zip_buf = create_test_zip(vec![
            ("index.html", b"<html></html>"),
            ("test_backend.php", b"hello from php"),
        ]);

        let config = SecurityConfig::default();
        let archive = zip::ZipArchive::new(zip_buf).unwrap();
        let res = inspect_zip_archive(archive, &config);

        assert!(matches!(res.unwrap_err(), SecurityError::ForbiddenFile(_)));
    }

    #[test]
    fn test_reject_hidden_env_file() {
        let zip_buf = create_test_zip(vec![
            ("index.html", b"<html></html>"),
            (".env", b"KEY=sample"),
        ]);

        let config = SecurityConfig::default();
        let archive = zip::ZipArchive::new(zip_buf).unwrap();
        let res = inspect_zip_archive(archive, &config);

        assert!(matches!(res.unwrap_err(), SecurityError::ForbiddenFile(_)));
    }

    #[test]
    fn test_reject_unsupported_exe_extension() {
        let zip_buf = create_test_zip(vec![
            ("index.html", b"<html></html>"),
            ("setup.exe", b"binarycontent"),
        ]);

        let config = SecurityConfig::default();
        let archive = zip::ZipArchive::new(zip_buf).unwrap();
        let res = inspect_zip_archive(archive, &config);

        assert!(matches!(res.unwrap_err(), SecurityError::ForbiddenFile(_)));
    }
}

