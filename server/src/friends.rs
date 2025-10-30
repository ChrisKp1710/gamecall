use axum::{
    extract::State,
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{AppState, models::{Friendship, FriendWithUser}};

#[derive(Debug, Deserialize)]
pub struct AddFriendRequest {
    pub friend_code: String,
}

#[derive(Debug, Deserialize)]
pub struct FriendActionRequest {
    pub friendship_id: String,
}

#[derive(Debug, Serialize)]
pub struct FriendResponse {
    pub id: String,
    pub username: String,
    pub friend_code: String,
    pub avatar_url: Option<String>,
    pub status: String,
    pub friendship_status: String,
}

pub async fn list_friends(
    State(state): State<Arc<AppState>>,
    // TODO: Estrarre user_id dal JWT token
) -> Result<Json<Vec<FriendResponse>>, (StatusCode, String)> {
    // Placeholder - serve middleware per autenticazione
    Err((StatusCode::NOT_IMPLEMENTED, "Authentication middleware required".to_string()))
}

pub async fn add_friend(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<AddFriendRequest>,
    // TODO: Estrarre user_id dal JWT token
) -> Result<Json<FriendResponse>, (StatusCode, String)> {
    // Placeholder - serve middleware per autenticazione
    // Logica:
    // 1. Trova utente con friend_code
    // 2. Controlla che non sia già amico
    // 3. Crea friendship con status='pending'
    // 4. Ritorna info amico
    Err((StatusCode::NOT_IMPLEMENTED, "Authentication middleware required".to_string()))
}

pub async fn list_requests(
    State(state): State<Arc<AppState>>,
    // TODO: Estrarre user_id dal JWT token
) -> Result<Json<Vec<FriendResponse>>, (StatusCode, String)> {
    // Placeholder - serve middleware per autenticazione
    // Ritorna tutte le richieste di amicizia in arrivo (status='pending' dove friend_id=current_user)
    Err((StatusCode::NOT_IMPLEMENTED, "Authentication middleware required".to_string()))
}

pub async fn accept_request(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<FriendActionRequest>,
    // TODO: Estrarre user_id dal JWT token
) -> Result<StatusCode, (StatusCode, String)> {
    // Placeholder - serve middleware per autenticazione
    // Logica:
    // 1. Trova friendship
    // 2. Verifica che friend_id sia current_user
    // 3. Aggiorna status a 'accepted'
    // 4. Crea friendship reciproca (user_id <-> friend_id)
    Err((StatusCode::NOT_IMPLEMENTED, "Authentication middleware required".to_string()))
}

pub async fn reject_request(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<FriendActionRequest>,
    // TODO: Estrarre user_id dal JWT token
) -> Result<StatusCode, (StatusCode, String)> {
    // Placeholder - serve middleware per autenticazione
    // Elimina la richiesta di amicizia
    Err((StatusCode::NOT_IMPLEMENTED, "Authentication middleware required".to_string()))
}

pub async fn remove_friend(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<FriendActionRequest>,
    // TODO: Estrarre user_id dal JWT token
) -> Result<StatusCode, (StatusCode, String)> {
    // Placeholder - serve middleware per autenticazione
    // Elimina entrambe le friendship (bidirezionale)
    Err((StatusCode::NOT_IMPLEMENTED, "Authentication middleware required".to_string()))
}
