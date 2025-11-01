use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        State,
    },
    response::Response,
    Extension,
};
use futures::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};

use crate::auth::Claims;

// Tipi di messaggi WebSocket
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum WsMessage {
    #[serde(rename = "friend_added")]
    FriendAdded {
        friend_id: String,
        friend_username: String,
        friend_code: String,
    },
    #[serde(rename = "friend_removed")]
    FriendRemoved {
        friend_id: String,
    },
    #[serde(rename = "user_online")]
    UserOnline {
        user_id: String,
    },
    #[serde(rename = "user_offline")]
    UserOffline {
        user_id: String,
    },
    #[serde(rename = "webrtc_signal")]
    WebRTCSignal {
        from_user_id: String,
        to_user_id: String,
        signal: serde_json::Value,
    },
    #[serde(rename = "ping")]
    Ping,
    #[serde(rename = "pong")]
    Pong,
}

// Stato globale per gestire le connessioni WebSocket
#[derive(Clone)]
pub struct WsState {
    // Mappa user_id -> broadcast sender
    pub connections: Arc<RwLock<HashMap<String, broadcast::Sender<String>>>>,
}

impl WsState {
    pub fn new() -> Self {
        Self {
            connections: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    // Invia messaggio a un utente specifico
    pub async fn send_to_user(&self, user_id: &str, message: &WsMessage) {
        let connections = self.connections.read().await;
        if let Some(tx) = connections.get(user_id) {
            let json = serde_json::to_string(message).unwrap();
            let _ = tx.send(json);
        }
    }

    // Broadcast a tutti gli utenti online
    pub async fn broadcast(&self, message: &WsMessage) {
        let connections = self.connections.read().await;
        let json = serde_json::to_string(message).unwrap();
        for tx in connections.values() {
            let _ = tx.send(json.clone());
        }
    }
}

// Handler WebSocket
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(ws_state): State<WsState>,
    Extension(claims): Extension<Claims>,
) -> Response {
    let user_id = claims.sub.clone();

    ws.on_upgrade(move |socket| handle_socket(socket, user_id, ws_state))
}

async fn handle_socket(socket: WebSocket, user_id: String, ws_state: WsState) {
    let (mut sender, mut receiver) = socket.split();

    // Crea broadcast channel per questo utente
    let (tx, mut rx) = broadcast::channel(100);

    // Registra connessione
    {
        let mut connections = ws_state.connections.write().await;
        connections.insert(user_id.clone(), tx.clone());
    }

    // Notifica che l'utente è online
    ws_state
        .broadcast(&WsMessage::UserOnline {
            user_id: user_id.clone(),
        })
        .await;

    // Task per inviare messaggi al client
    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Task per ricevere messaggi dal client
    let user_id_clone2 = user_id.clone();
    let ws_state_clone = ws_state.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                // Gestisci ping/pong e WebRTC signaling
                if let Ok(ws_msg) = serde_json::from_str::<WsMessage>(&text) {
                    match ws_msg {
                        WsMessage::Ping => {
                            ws_state_clone
                                .send_to_user(&user_id_clone2, &WsMessage::Pong)
                                .await;
                        }
                        WsMessage::WebRTCSignal { from_user_id: _, to_user_id, signal } => {
                            // Relay WebRTC signal to destination user
                            ws_state_clone
                                .send_to_user(
                                    &to_user_id,
                                    &WsMessage::WebRTCSignal {
                                        from_user_id: user_id_clone2.clone(),
                                        to_user_id: to_user_id.clone(),
                                        signal,
                                    },
                                )
                                .await;
                        }
                        _ => {}
                    }
                }
            } else if let Message::Close(_) = msg {
                break;
            }
        }
    });

    // Attendi che uno dei task finisca
    tokio::select! {
        _ = (&mut send_task) => recv_task.abort(),
        _ = (&mut recv_task) => send_task.abort(),
    }

    // Rimuovi connessione
    {
        let mut connections = ws_state.connections.write().await;
        connections.remove(&user_id);
    }

    // Notifica che l'utente è offline
    ws_state
        .broadcast(&WsMessage::UserOffline { user_id })
        .await;
}
