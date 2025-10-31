use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Extension,
    Json,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use uuid::Uuid;

use crate::auth::Claims;
use crate::websocket::WsMessage;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct Message {
    pub id: Uuid,
    pub sender_id: Uuid,
    pub receiver_id: Uuid,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct SendMessageRequest {
    pub receiver_id: String,
    pub content: String,
}

#[derive(Debug, Deserialize)]
pub struct GetMessagesQuery {
    pub contact_id: String,
    #[serde(default = "default_limit")]
    pub limit: i32,
    pub before: Option<DateTime<Utc>>,
}

fn default_limit() -> i32 {
    50
}

#[derive(Debug, Serialize)]
pub struct MessageResponse {
    pub id: String,
    pub sender_id: String,
    pub receiver_id: String,
    pub content: String,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}

impl From<Message> for MessageResponse {
    fn from(msg: Message) -> Self {
        Self {
            id: msg.id.to_string(),
            sender_id: msg.sender_id.to_string(),
            receiver_id: msg.receiver_id.to_string(),
            content: msg.content,
            created_at: msg.created_at,
            read_at: msg.read_at,
        }
    }
}

/// Invia un messaggio a un contatto
pub async fn send_message(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<SendMessageRequest>,
) -> Result<Json<MessageResponse>, StatusCode> {
    let user_id = claims.sub;
    // Validazione
    if payload.content.trim().is_empty() {
        return Err(StatusCode::BAD_REQUEST);
    }

    if payload.content.len() > 10000 {
        return Err(StatusCode::BAD_REQUEST);
    }

    let sender_id = Uuid::parse_str(&user_id).map_err(|_| StatusCode::BAD_REQUEST)?;
    let receiver_id = Uuid::parse_str(&payload.receiver_id).map_err(|_| StatusCode::BAD_REQUEST)?;

    // Verifica che sender e receiver siano amici
    let are_friends = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
            SELECT 1 FROM friendships
            WHERE (user_id = $1 AND friend_id = $2 AND status = 'accepted')
        )",
    )
    .bind(sender_id)
    .bind(receiver_id)
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if !are_friends {
        return Err(StatusCode::FORBIDDEN);
    }

    // Inserisci messaggio
    let message = sqlx::query_as!(
        Message,
        "INSERT INTO messages (sender_id, receiver_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, sender_id, receiver_id, content, created_at, read_at",
        sender_id,
        receiver_id,
        payload.content.trim()
    )
    .fetch_one(&state.db)
    .await
    .map_err(|e| {
        eprintln!("Error inserting message: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    // Invia notifica WebSocket al destinatario
    state
        .ws_state
        .send_to_user(
            &receiver_id.to_string(),
            &WsMessage::MessageReceived {
                message_id: message.id.to_string(),
                sender_id: sender_id.to_string(),
                content: message.content.clone(),
                timestamp: message.created_at,
            },
        )
        .await;

    Ok(Json(message.into()))
}

/// Ottieni messaggi con un contatto specifico
pub async fn get_messages(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<GetMessagesQuery>,
) -> Result<Json<Vec<MessageResponse>>, StatusCode> {
    let current_user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::BAD_REQUEST)?;
    let contact_id = Uuid::parse_str(&query.contact_id).map_err(|_| StatusCode::BAD_REQUEST)?;

    // Verifica amicizia
    let are_friends = sqlx::query_scalar::<_, bool>(
        "SELECT EXISTS(
            SELECT 1 FROM friendships
            WHERE (user_id = $1 AND friend_id = $2 AND status = 'accepted')
        )",
    )
    .bind(current_user_id)
    .bind(contact_id)
    .fetch_one(&state.db)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if !are_friends {
        return Err(StatusCode::FORBIDDEN);
    }

    // Ottieni messaggi (conversazione bidirezionale)
    let messages = if let Some(before) = query.before {
        sqlx::query_as!(
            Message,
            "SELECT id, sender_id, receiver_id, content, created_at, read_at
             FROM messages
             WHERE ((sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1))
               AND created_at < $3
             ORDER BY created_at DESC
             LIMIT $4",
            current_user_id,
            contact_id,
            before,
            query.limit as i64
        )
        .fetch_all(&state.db)
        .await
    } else {
        sqlx::query_as!(
            Message,
            "SELECT id, sender_id, receiver_id, content, created_at, read_at
             FROM messages
             WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
             ORDER BY created_at DESC
             LIMIT $3",
            current_user_id,
            contact_id,
            query.limit as i64
        )
        .fetch_all(&state.db)
        .await
    }
    .map_err(|e| {
        eprintln!("Error fetching messages: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(
        messages.into_iter().map(MessageResponse::from).collect(),
    ))
}

/// Segna messaggi come letti
pub async fn mark_as_read(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
    Path(contact_id): Path<String>,
) -> Result<StatusCode, StatusCode> {
    let current_user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::BAD_REQUEST)?;
    let contact_uuid = Uuid::parse_str(&contact_id).map_err(|_| StatusCode::BAD_REQUEST)?;

    // Marca tutti i messaggi non letti da questo contatto come letti
    sqlx::query!(
        "UPDATE messages
         SET read_at = NOW()
         WHERE receiver_id = $1 AND sender_id = $2 AND read_at IS NULL",
        current_user_id,
        contact_uuid
    )
    .execute(&state.db)
    .await
    .map_err(|e| {
        eprintln!("Error marking messages as read: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(StatusCode::OK)
}

/// Ottieni numero di messaggi non letti per ogni contatto
pub async fn get_unread_counts(
    State(state): State<Arc<AppState>>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<(String, i64)>>, StatusCode> {
    let current_user_id = Uuid::parse_str(&claims.sub).map_err(|_| StatusCode::BAD_REQUEST)?;

    let counts = sqlx::query!(
        "SELECT sender_id, COUNT(*) as count
         FROM messages
         WHERE receiver_id = $1 AND read_at IS NULL
         GROUP BY sender_id",
        current_user_id
    )
    .fetch_all(&state.db)
    .await
    .map_err(|e| {
        eprintln!("Error fetching unread counts: {}", e);
        StatusCode::INTERNAL_SERVER_ERROR
    })?;

    Ok(Json(
        counts
            .into_iter()
            .map(|row| (row.sender_id.to_string(), row.count.unwrap_or(0)))
            .collect(),
    ))
}
