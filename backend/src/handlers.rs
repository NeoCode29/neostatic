use std::sync::Arc;
use axum::{
    extract::{Multipart, Path, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use serde::Serialize;

use crate::config::AppConfig;
use crate::deployer::{delete_site, deploy_site, get_system_stats, list_sites, SystemStats};

pub struct AppState {
    pub config: AppConfig,
}

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
}

#[derive(Serialize)]
pub struct HealthStatus {
    pub status: String,
    pub version: String,
    pub service: String,
}

fn check_auth(headers: &HeaderMap, expected_token: &Option<String>) -> bool {
    let expected = match expected_token {
        Some(token) => token,
        None => return true, // Auth dinonaktifkan jika token tidak diset di env
    };

    if let Some(auth_header) = headers.get("authorization") {
        if let Ok(auth_str) = auth_header.to_str() {
            if auth_str == expected || auth_str.strip_prefix("Bearer ").map(|s| s.trim()) == Some(expected.as_str()) {
                return true;
            }
        }
    }

    if let Some(token_header) = headers.get("x-admin-token") {
        if let Ok(token_str) = token_header.to_str() {
            if token_str == expected {
                return true;
            }
        }
    }

    false
}

/// GET /api/health
pub async fn health_handler() -> Json<HealthStatus> {
    Json(HealthStatus {
        status: "ok".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        service: "neostatic-backend".to_string(),
    })
}

/// GET /api/stats
pub async fn stats_handler(
    State(state): State<Arc<AppState>>,
) -> Json<ApiResponse<SystemStats>> {
    let stats = get_system_stats(&state.config.deploy);
    Json(ApiResponse::success("Statistik sistem berhasil diambil", stats))
}

/// GET /api/sites
pub async fn list_sites_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
) -> Response {
    if !check_auth(&headers, &state.config.admin_token) {
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error("Token otentikasi tidak valid atau tidak disertakan")),
        ).into_response();
    }

    match list_sites(&state.config.deploy) {
        Ok(sites) => (
            StatusCode::OK,
            Json(ApiResponse::success("Daftar situs berhasil diambil", sites)),
        ).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(&format!("Gagal mengambil daftar situs: {}", e))),
        ).into_response(),
    }
}

/// DELETE /api/sites/:slug
pub async fn delete_site_handler(
    State(state): State<Arc<AppState>>,
    Path(slug): Path<String>,
    headers: HeaderMap,
) -> Response {
    if !check_auth(&headers, &state.config.admin_token) {
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error("Token otentikasi tidak valid")),
        ).into_response();
    }

    match delete_site(&slug, &state.config.deploy) {
        Ok(_) => (
            StatusCode::OK,
            Json(ApiResponse::<()>::message(&format!("Situs '{}' berhasil dihapus", slug))),
        ).into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::<()>::error(&format!("Gagal menghapus situs: {}", e))),
        ).into_response(),
    }
}

/// POST /api/deploy
pub async fn deploy_handler(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    mut multipart: Multipart,
) -> Response {
    if !check_auth(&headers, &state.config.admin_token) {
        return (
            StatusCode::UNAUTHORIZED,
            Json(ApiResponse::<()>::error("Token otentikasi tidak valid")),
        ).into_response();
    }

    let mut slug: Option<String> = None;
    let mut zip_bytes: Option<Vec<u8>> = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let field_name = field.name().unwrap_or("").to_string();

        if field_name == "slug" {
            if let Ok(text) = field.text().await {
                slug = Some(text.trim().to_string());
            }
        } else if field_name == "file" || field_name == "archive" {
            if let Ok(bytes) = field.bytes().await {
                zip_bytes = Some(bytes.to_vec());
            }
        }
    }

    let slug = match slug {
        Some(s) if !s.is_empty() => s,
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<()>::error("Field 'slug' wajib diisi")),
            ).into_response();
        }
    };

    let zip_bytes = match zip_bytes {
        Some(b) if !b.is_empty() => b,
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse::<()>::error("File arsip .zip tidak ditemukan")),
            ).into_response();
        }
    };

    match deploy_site(&slug, &zip_bytes, &state.config.deploy) {
        Ok(result) => (
            StatusCode::OK,
            Json(ApiResponse::success(
                &format!("Halaman '{}' berhasil diverifikasi dan dideploy!", slug),
                result,
            )),
        ).into_response(),
        Err(crate::deployer::DeployError::Security(e)) => (
            StatusCode::UNPROCESSABLE_ENTITY,
            Json(ApiResponse::<()>::error(&format!("Gagal verifikasi keamanan: {}", e))),
        ).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::<()>::error(&format!("Deployment gagal: {}", e))),
        ).into_response(),
    }
}

impl<T> ApiResponse<T> {
    pub fn success(message: &str, data: T) -> Self {
        Self {
            success: true,
            message: message.to_string(),
            data: Some(data),
        }
    }

    pub fn message(message: &str) -> ApiResponse<()> {
        ApiResponse {
            success: true,
            message: message.to_string(),
            data: None,
        }
    }

    pub fn error(message: &str) -> ApiResponse<()> {
        ApiResponse {
            success: false,
            message: message.to_string(),
            data: None,
        }
    }
}
