use axum::{
    middleware as axum_middleware,
    routing::{get, post},
    Router,
};
use sqlx::postgres::PgPoolOptions;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber;

mod auth;
mod friends;
mod middleware;
mod models;
mod utils;
mod websocket;

#[derive(Clone)]
pub struct AppState {
    pub db: sqlx::PgPool,
    pub jwt_secret: String,
    pub ws_state: websocket::WsState,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Carica variabili d'ambiente
    dotenv::dotenv().ok();

    // Setup logging
    tracing_subscriber::fmt::init();

    // Leggi configurazione
    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL must be set");
    let jwt_secret = std::env::var("JWT_SECRET")
        .expect("JWT_SECRET must be set");
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string());

    // Connessione al database
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await?;

    tracing::info!("Connected to database");

    // Crea WebSocket state
    let ws_state = websocket::WsState::new();

    // State condiviso
    let state = Arc::new(AppState {
        db: pool,
        jwt_secret,
        ws_state: ws_state.clone(),
    });

    // Setup CORS
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // WebSocket route (protected)
    let ws_route = Router::new()
        .route("/ws", get(websocket::ws_handler))
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            middleware::auth_middleware,
        ))
        .with_state(ws_state);

    // Protected routes (require JWT)
    let protected = Router::new()
        .route("/auth/me", get(auth::me))
        .route("/friends", get(friends::list_friends))
        .route("/friends/add", post(friends::add_friend))
        .route("/friends/requests", get(friends::list_requests))
        .route("/friends/accept", post(friends::accept_request))
        .route("/friends/reject", post(friends::reject_request))
        .route("/friends/remove", post(friends::remove_friend))
        .layer(axum_middleware::from_fn_with_state(
            state.clone(),
            middleware::auth_middleware,
        ));

    // Setup router
    let app = Router::new()
        .route("/health", get(health_check))
        // Auth routes (public)
        .route("/auth/register", post(auth::register))
        .route("/auth/login", post(auth::login))
        // Merge protected routes
        .merge(protected)
        // Merge WebSocket route
        .merge(ws_route)
        .layer(cors)
        .with_state(state);

    // Avvia server
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port))
        .await?;
    
    tracing::info!("Server listening on port {}", port);
    
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_check() -> &'static str {
    "OK"
}
