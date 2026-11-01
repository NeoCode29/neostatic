pub mod config;
pub mod deployer;
pub mod handlers;
pub mod security;
pub mod static_files;

use std::sync::Arc;
use axum::{
    routing::{delete, get, post},
    Router,
};
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::ServeDir;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::AppConfig;
use crate::handlers::{delete_site_handler, deploy_handler, health_handler, list_sites_handler, stats_handler, AppState};
use crate::static_files::static_handler;

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,neostatic_backend=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = AppConfig::from_env();
    let bind_addr = config.bind_addr.clone();

    tracing::info!("Starting Neostatic Backend on {}", bind_addr);
    tracing::info!("Target Static Dir: {:?}", config.deploy.static_dir);
    tracing::info!("Target Release Dir: {:?}", config.deploy.release_dir);
    tracing::info!("Public URL Prefix: {}", config.deploy.public_url_prefix);

    let static_dir_path = config.deploy.static_dir.clone();
    let state = Arc::new(AppState { config });

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let api_routes = Router::new()
        .route("/health", get(health_handler))
        .route("/stats", get(stats_handler))
        .route("/deploy", post(deploy_handler))
        .route("/sites", get(list_sites_handler))
        .route("/sites/{slug}", delete(delete_site_handler))
        .layer(cors)
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let app = Router::new()
        .nest("/api", api_routes)
        .nest_service("/staticpage", ServeDir::new(static_dir_path))
        .fallback(static_handler);

    let listener = tokio::net::TcpListener::bind(&bind_addr)
        .await
        .expect("Failed to bind TCP listener");

    tracing::info!("🚀 Neostatic Single-Binary Server active on http://{}", bind_addr);

    axum::serve(listener, app)
        .await
        .expect("Server encountered a fatal error");
}
