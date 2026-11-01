use std::path::PathBuf;
use crate::deployer::DeployConfig;
use crate::security::SecurityConfig;

#[derive(Clone, Debug)]
pub struct AppConfig {
    pub bind_addr: String,
    pub admin_token: Option<String>,
    pub deploy: DeployConfig,
}

impl AppConfig {
    pub fn from_env() -> Self {
        let port = std::env::var("PORT").unwrap_or_else(|_| "8080".to_string());
        let bind_host = std::env::var("BIND_HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
        let bind_addr = format!("{}:{}", bind_host, port);

        let admin_token = std::env::var("ADMIN_TOKEN").ok().filter(|s| !s.trim().is_empty());

        let static_dir = std::env::var("BASE_STATIC_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                #[cfg(unix)]
                { PathBuf::from("/var/www/staticpage") }
                #[cfg(not(unix))]
                { PathBuf::from("./storage/staticpage") }
            });

        let release_dir = std::env::var("BASE_RELEASE_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                #[cfg(unix)]
                { PathBuf::from("/var/www/releases") }
                #[cfg(not(unix))]
                { PathBuf::from("./storage/releases") }
            });

        let public_url_prefix = std::env::var("PUBLIC_URL_PREFIX")
            .unwrap_or_else(|_| {
                #[cfg(unix)]
                { "https://neoproject.my.id/staticpage".to_string() }
                #[cfg(not(unix))]
                { format!("http://localhost:{}/staticpage", port) }
            });

        let max_upload_mb: u64 = std::env::var("MAX_UPLOAD_SIZE_MB")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(50);

        let security = SecurityConfig {
            max_file_count: 2_500,
            max_uncompressed_bytes: 150 * 1024 * 1024,
            max_single_file_bytes: max_upload_mb * 1024 * 1024,
            max_compression_ratio: 100.0,
        };

        let deploy = DeployConfig {
            static_dir,
            release_dir,
            public_url_prefix,
            security,
        };

        Self {
            bind_addr,
            admin_token,
            deploy,
        }
    }
}

