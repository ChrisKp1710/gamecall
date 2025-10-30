use axum::{
    extract::State,
    http::StatusCode,
    Extension,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::{AppState, auth::Claims, models::User};

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
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<FriendResponse>>, (StatusCode, String)> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid user ID".to_string()))?;

    // Query per ottenere tutti gli amici accettati
    let friends = sqlx::query_as::<_, (Uuid, String, String, Option<String>, String, String)>(
        r#"
        SELECT u.id, u.username, u.friend_code, u.avatar_url, u.status, f.status as friendship_status
        FROM friendships f
        JOIN users u ON (f.friend_id = u.id)
        WHERE f.user_id = $1 AND f.status = 'accepted'
        "#
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .into_iter()
    .map(|(id, username, friend_code, avatar_url, status, friendship_status)| FriendResponse {
        id: id.to_string(),
        username,
        friend_code,
        avatar_url,
        status,
        friendship_status,
    })
    .collect();

    Ok(Json(friends))
}

pub async fn add_friend(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<AddFriendRequest>,
) -> Result<Json<FriendResponse>, (StatusCode, String)> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid user ID".to_string()))?;

    // Trova utente con friend_code
    let friend = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE friend_code = $1"
    )
    .bind(&payload.friend_code)
    .fetch_optional(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Friend code not found".to_string()))?;

    // Non puoi aggiungere te stesso
    if friend.id == user_id {
        return Err((StatusCode::BAD_REQUEST, "Cannot add yourself as friend".to_string()));
    }

    // Controlla se già amici o richiesta pending
    let existing = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM friendships WHERE user_id = $1 AND friend_id = $2"
    )
    .bind(user_id)
    .bind(friend.id)
    .fetch_one(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if existing > 0 {
        return Err((StatusCode::CONFLICT, "Friend request already exists".to_string()));
    }

    // Crea richiesta di amicizia
    let friendship_id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO friendships (id, user_id, friend_id, status)
        VALUES ($1, $2, $3, 'pending')
        "#
    )
    .bind(friendship_id)
    .bind(user_id)
    .bind(friend.id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(FriendResponse {
        id: friend.id.to_string(),
        username: friend.username,
        friend_code: friend.friend_code,
        avatar_url: friend.avatar_url,
        status: friend.status,
        friendship_status: "pending".to_string(),
    }))
}

pub async fn list_requests(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<FriendResponse>>, (StatusCode, String)> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid user ID".to_string()))?;

    // Query per ottenere tutte le richieste in arrivo
    let requests = sqlx::query_as::<_, (Uuid, String, String, Option<String>, String, String)>(
        r#"
        SELECT u.id, u.username, u.friend_code, u.avatar_url, u.status, f.status as friendship_status
        FROM friendships f
        JOIN users u ON (f.user_id = u.id)
        WHERE f.friend_id = $1 AND f.status = 'pending'
        "#
    )
    .bind(user_id)
    .fetch_all(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .into_iter()
    .map(|(id, username, friend_code, avatar_url, status, friendship_status)| FriendResponse {
        id: id.to_string(),
        username,
        friend_code,
        avatar_url,
        status,
        friendship_status,
    })
    .collect();

    Ok(Json(requests))
}

pub async fn accept_request(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<FriendActionRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid user ID".to_string()))?;
    
    let requester_id = Uuid::parse_str(&payload.friendship_id)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid friendship ID".to_string()))?;

    // Aggiorna la richiesta a 'accepted'
    let result = sqlx::query(
        r#"
        UPDATE friendships 
        SET status = 'accepted'
        WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'
        "#
    )
    .bind(requester_id)
    .bind(user_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Friend request not found".to_string()));
    }

    // Crea amicizia reciproca
    let friendship_id = Uuid::new_v4();
    sqlx::query(
        r#"
        INSERT INTO friendships (id, user_id, friend_id, status)
        VALUES ($1, $2, $3, 'accepted')
        "#
    )
    .bind(friendship_id)
    .bind(user_id)
    .bind(requester_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::OK)
}

pub async fn reject_request(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<FriendActionRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid user ID".to_string()))?;
    
    let requester_id = Uuid::parse_str(&payload.friendship_id)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid friendship ID".to_string()))?;

    // Elimina la richiesta
    let result = sqlx::query(
        "DELETE FROM friendships WHERE user_id = $1 AND friend_id = $2 AND status = 'pending'"
    )
    .bind(requester_id)
    .bind(user_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    if result.rows_affected() == 0 {
        return Err((StatusCode::NOT_FOUND, "Friend request not found".to_string()));
    }

    Ok(StatusCode::OK)
}

pub async fn remove_friend(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<FriendActionRequest>,
) -> Result<StatusCode, (StatusCode, String)> {
    let user_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid user ID".to_string()))?;
    
    let friend_id = Uuid::parse_str(&payload.friendship_id)
        .map_err(|_| (StatusCode::BAD_REQUEST, "Invalid friendship ID".to_string()))?;

    // Elimina entrambe le amicizie (bidirezionale)
    sqlx::query(
        "DELETE FROM friendships WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)"
    )
    .bind(user_id)
    .bind(friend_id)
    .execute(&state.db)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::OK)
}
