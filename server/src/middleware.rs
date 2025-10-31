use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use std::sync::Arc;

use crate::{auth::Claims, AppState};

/// Middleware per estrarre e validare JWT token
pub async fn auth_middleware(
    State(state): State<Arc<AppState>>,
    mut req: Request,
    next: Next,
) -> Result<Response, (StatusCode, String)> {
    // Prova prima con header Authorization
    let token = if let Some(auth_header) = req
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
    {
        // Verifica formato "Bearer <token>"
        auth_header
            .strip_prefix("Bearer ")
            .ok_or((StatusCode::UNAUTHORIZED, "Invalid authorization format".to_string()))?
            .to_string()
    } else {
        // Se non c'è header, prova con query parameter (per WebSocket)
        let uri = req.uri();
        let query = uri.query().unwrap_or("");

        query
            .split('&')
            .find_map(|param| {
                let mut parts = param.split('=');
                if parts.next() == Some("token") {
                    parts.next().map(|t| t.to_string())
                } else {
                    None
                }
            })
            .ok_or((StatusCode::UNAUTHORIZED, "Missing authorization".to_string()))?
    };

    // Valida JWT
    let token_data = decode::<Claims>(
        &token,
        &DecodingKey::from_secret(state.jwt_secret.as_ref()),
        &Validation::default(),
    )
    .map_err(|e| (StatusCode::UNAUTHORIZED, format!("Invalid token: {}", e)))?;

    // Inserisci claims nella request per usarli nei handler
    req.extensions_mut().insert(token_data.claims);

    Ok(next.run(req).await)
}
