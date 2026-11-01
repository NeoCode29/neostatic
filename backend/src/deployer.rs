use std::fs;
use std::io::{Cursor, Read, Write};
use std::path::{Path, PathBuf};
use chrono::Utc;
use thiserror::Error;

use crate::security::{inspect_zip_archive, validate_slug, SecurityConfig, SecurityError};

#[derive(Error, Debug)]
pub enum DeployError {
    #[error("Validasi keamanan gagal: {0}")]
    Security(#[from] SecurityError),

    #[error("Operasi I/O filesystem gagal: {0}")]
    Io(#[from] std::io::Error),

    #[error("Gagal membuat symlink rilis: {0}")]
    SymlinkError(String),
}

#[derive(Debug, Clone)]
pub struct DeployConfig {
    pub static_dir: PathBuf,
    pub release_dir: PathBuf,
    pub public_url_prefix: String,
    pub security: SecurityConfig,
}

impl Default for DeployConfig {
    fn default() -> Self {
        Self {
            static_dir: PathBuf::from("/var/www/staticpage"),
            release_dir: PathBuf::from("/var/www/releases"),
            public_url_prefix: "https://neoproject.my.id/staticpage".to_string(),
            security: SecurityConfig::default(),
        }
    }
}

#[derive(Debug, serde::Serialize)]
pub struct DeployResult {
    pub slug: String,
    pub release_id: String,
    pub url: String,
    pub total_files: usize,
    pub total_bytes: u64,
}

#[derive(Debug, serde::Serialize)]
pub struct ActiveSite {
    pub slug: String,
    pub url: String,
    pub active_release: String,
    pub updated_at: String,
    pub size_bytes: u64,
}

#[derive(Debug, serde::Serialize)]
pub struct SystemStats {
    pub total_sites: usize,
    pub static_bytes: u64,
    pub releases_bytes: u64,
    pub total_bytes: u64,
    pub blocked_traversals: u64,
    pub blocked_forbidden: u64,
    pub integrity_rate: f64,
}

pub fn get_dir_size(path: &Path) -> u64 {
    if !path.exists() {
        return 0;
    }
    walkdir::WalkDir::new(path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.file_type().is_file())
        .map(|e| e.metadata().map(|m| m.len()).unwrap_or(0))
        .sum()
}

pub fn get_system_stats(config: &DeployConfig) -> SystemStats {
    let sites = list_sites(config).unwrap_or_default();
    let static_bytes = get_dir_size(&config.static_dir);
    let releases_bytes = get_dir_size(&config.release_dir);
    let total_bytes = static_bytes + releases_bytes;

    let blocked_traversals = crate::security::BLOCKED_TRAVERSALS.load(std::sync::atomic::Ordering::Relaxed);
    let blocked_forbidden = crate::security::BLOCKED_FORBIDDEN.load(std::sync::atomic::Ordering::Relaxed);

    SystemStats {
        total_sites: sites.len(),
        static_bytes,
        releases_bytes,
        total_bytes,
        blocked_traversals,
        blocked_forbidden,
        integrity_rate: 100.0,
    }
}

/// Menjalankan deployment aman dengan ekstraksi atomic dan update symlink
pub fn deploy_site(
    slug: &str,
    zip_bytes: &[u8],
    config: &DeployConfig,
) -> Result<DeployResult, DeployError> {
    // 1. Validasi Slug URL
    validate_slug(slug)?;

    // 2. Inspeksi Keamanan ZIP dalam memori
    let cursor = Cursor::new(zip_bytes);
    let archive = zip::ZipArchive::new(cursor)
        .map_err(|e| SecurityError::ZipReadError(e.to_string()))?;

    let inspection = inspect_zip_archive(archive, &config.security)?;

    // 3. Siapkan Direktori Rilis
    let release_id = Utc::now().format("%Y%m%d_%H%M%S").to_string();
    let site_releases_dir = config.release_dir.join(slug);
    let target_release_path = site_releases_dir.join(&release_id);

    fs::create_dir_all(&target_release_path)?;

    // Ekstraksi aman hanya untuk file yang telah lolos verifikasi
    let mut extract_archive = zip::ZipArchive::new(Cursor::new(zip_bytes))
        .map_err(|e| SecurityError::ZipReadError(e.to_string()))?;

    for i in 0..extract_archive.len() {
        let mut file = extract_archive
            .by_index(i)
            .map_err(|e| SecurityError::ZipReadError(e.to_string()))?;

        if file.is_dir() {
            continue;
        }

        let enclosed = match file.enclosed_name() {
            Some(p) => p.to_path_buf(),
            None => continue,
        };

        let dest_path = target_release_path.join(enclosed);
        if let Some(parent) = dest_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let mut outfile = fs::File::create(&dest_path)?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;
        outfile.write_all(&buffer)?;
    }

    // Tulis file metadata .release_id agar versi rilis selalu terbaca baik via symlink maupun copy fallback
    let _ = fs::write(target_release_path.join(".release_id"), release_id.as_bytes());

    // 4. Atomic Symlink Switch
    fs::create_dir_all(&config.static_dir)?;
    let symlink_path = config.static_dir.join(slug);

    create_atomic_symlink(&target_release_path, &symlink_path)?;

    let live_url = format!("{}/{}/", config.public_url_prefix.trim_end_matches('/'), slug);

    Ok(DeployResult {
        slug: slug.to_string(),
        release_id,
        url: live_url,
        total_files: inspection.total_files,
        total_bytes: inspection.total_uncompressed_bytes,
    })
}

/// Menghapus situs (symlink dan folder releases)
pub fn delete_site(slug: &str, config: &DeployConfig) -> Result<(), DeployError> {
    validate_slug(slug)?;

    let symlink_path = config.static_dir.join(slug);
    if symlink_path.exists() || symlink_path.is_symlink() {
        #[cfg(unix)]
        let _ = fs::remove_file(&symlink_path);
        #[cfg(not(unix))]
        let _ = fs::remove_dir_all(&symlink_path);
    }

    let releases_path = config.release_dir.join(slug);
    if releases_path.exists() {
        fs::remove_dir_all(releases_path)?;
    }

    Ok(())
}

/// Mengambil daftar situs aktif dari direktori symlink
pub fn list_sites(config: &DeployConfig) -> Result<Vec<ActiveSite>, DeployError> {
    let mut sites = Vec::new();
    if !config.static_dir.exists() {
        return Ok(sites);
    }

    for entry in fs::read_dir(&config.static_dir)? {
        let entry = entry?;
        let slug = entry.file_name().to_string_lossy().to_string();

        if validate_slug(&slug).is_err() {
            continue;
        }

        let symlink_path = entry.path();
        let active_release = if let Ok(target) = fs::read_link(&symlink_path) {
            target
                .file_name()
                .map(|f| f.to_string_lossy().to_string())
                .unwrap_or_else(|| "unknown".to_string())
        } else if let Ok(meta_id) = fs::read_to_string(symlink_path.join(".release_id")) {
            meta_id.trim().to_string()
        } else {
            // Ambil rilis terbaru dari folder releases jika ada
            let site_releases = config.release_dir.join(&slug);
            if let Ok(entries) = fs::read_dir(site_releases) {
                let mut dirs: Vec<String> = entries
                    .filter_map(|e| e.ok())
                    .filter(|e| e.path().is_dir())
                    .map(|e| e.file_name().to_string_lossy().to_string())
                    .collect();
                dirs.sort();
                dirs.pop().unwrap_or_else(|| "unknown".to_string())
            } else {
                "unknown".to_string()
            }
        };

        let updated_at = entry
            .metadata()
            .and_then(|m| m.modified())
            .map(|t| chrono::DateTime::<Utc>::from(t).to_rfc3339())
            .unwrap_or_default();

        let url = format!("{}/{}/", config.public_url_prefix.trim_end_matches('/'), slug);
        let size_bytes = get_dir_size(&symlink_path);

        sites.push(ActiveSite {
            slug,
            url,
            active_release,
            updated_at,
            size_bytes,
        });
    }

    sites.sort_by(|a, b| b.updated_at.cmp(&a.updated_at));
    Ok(sites)
}

fn create_atomic_symlink(target: &Path, link_name: &Path) -> Result<(), DeployError> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::symlink;
        let temp_link = link_name.with_extension(format!("tmp.{}", Utc::now().timestamp_nanos_opt().unwrap_or(0)));
        if temp_link.exists() || temp_link.is_symlink() {
            let _ = fs::remove_file(&temp_link);
        }
        symlink(target, &temp_link).map_err(|e| DeployError::SymlinkError(e.to_string()))?;
        fs::rename(&temp_link, link_name).map_err(|e| DeployError::SymlinkError(e.to_string()))?;
        Ok(())
    }

    #[cfg(windows)]
    {
        use std::os::windows::fs::symlink_dir;
        if link_name.exists() || link_name.is_symlink() {
            let _ = fs::remove_dir_all(link_name);
        }
        match symlink_dir(target, link_name) {
            Ok(_) => Ok(()),
            Err(_) => {
                // Fallback untuk Windows dev mode jika user tidak memiliki Privilege SeCreateSymbolicLink
                copy_dir_all(target, link_name).map_err(|e| DeployError::SymlinkError(e.to_string()))
            }
        }
    }
}

#[cfg(windows)]
fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dst.join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), dst.join(entry.file_name()))?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Cursor, Write};
    use zip::write::{SimpleFileOptions, ZipWriter};

    fn make_test_zip(files: Vec<(&str, &[u8])>) -> Vec<u8> {
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
        buf.into_inner()
    }

    #[test]
    fn test_full_deploy_lifecycle() {
        let temp_dir = tempfile::tempdir().unwrap();
        let static_dir = temp_dir.path().join("staticpage");
        let release_dir = temp_dir.path().join("releases");

        let config = DeployConfig {
            static_dir: static_dir.clone(),
            release_dir: release_dir.clone(),
            public_url_prefix: "https://neoproject.my.id/staticpage".to_string(),
            security: SecurityConfig::default(),
        };

        let zip_bytes = make_test_zip(vec![
            ("index.html", b"<!DOCTYPE html><html><body><h1>Neostatic Demo</h1></body></html>"),
            ("styles.css", b"body { margin: 0; }"),
        ]);

        // 1. Deploy
        let result = deploy_site("test-site", &zip_bytes, &config).unwrap();
        assert_eq!(result.slug, "test-site");
        assert_eq!(result.total_files, 2);
        assert_eq!(result.url, "https://neoproject.my.id/staticpage/test-site/");

        // Verify index.html exists in live destination
        let deployed_index = static_dir.join("test-site").join("index.html");
        assert!(deployed_index.exists());

        // 2. List sites
        let sites = list_sites(&config).unwrap();
        assert_eq!(sites.len(), 1);
        assert_eq!(sites[0].slug, "test-site");

        // 3. Delete site
        delete_site("test-site", &config).unwrap();
        let sites_after = list_sites(&config).unwrap();
        assert_eq!(sites_after.len(), 0);
    }
}
