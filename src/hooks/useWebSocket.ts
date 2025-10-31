import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Tipi dei messaggi WebSocket
export type WsMessage =
  | { type: 'friend_added'; friend_id: string; friend_username: string; friend_code: string }
  | { type: 'friend_removed'; friend_id: string }
  | { type: 'user_online'; user_id: string }
  | { type: 'user_offline'; user_id: string }
  | { type: 'ping' }
  | { type: 'pong' };

interface UseWebSocketOptions {
  onMessage?: (message: WsMessage) => void;
  onFriendAdded?: (friendId: string, friendUsername: string, friendCode: string) => void;
  onFriendRemoved?: (friendId: string) => void;
  onUserOnline?: (userId: string) => void;
  onUserOffline?: (userId: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { token } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!token) return;

    // Determina URL WebSocket in base all'ambiente
    const baseUrl = import.meta.env.DEV
      ? 'ws://localhost:3000/ws'
      : 'wss://gamecall-api.fly.dev/ws';

    // Aggiungi token come query parameter (non supportato nei WebSocket header)
    const wsUrl = `${baseUrl}?token=${token}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connesso');
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data);
          console.log('[WebSocket] Messaggio ricevuto:', message);

          // Gestisci ping/pong per keepalive
          if (message.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong' }));
            return;
          }

          // Callback generica
          options.onMessage?.(message);

          // Callbacks specifiche per tipo di messaggio
          switch (message.type) {
            case 'friend_added':
              options.onFriendAdded?.(
                message.friend_id,
                message.friend_username,
                message.friend_code
              );
              break;
            case 'friend_removed':
              options.onFriendRemoved?.(message.friend_id);
              break;
            case 'user_online':
              options.onUserOnline?.(message.user_id);
              break;
            case 'user_offline':
              options.onUserOffline?.(message.user_id);
              break;
          }
        } catch (err) {
          console.error('[WebSocket] Errore parsing messaggio:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Errore:', error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnesso');
        wsRef.current = null;

        // Tenta riconnessione con backoff esponenziale
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`[WebSocket] Riconnessione in ${delay}ms...`);

          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WebSocket] Errore connessione:', err);
    }
  }, [token, options]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: WsMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Non connesso, impossibile inviare messaggio');
    }
  }, []);

  // Connetti/disconnetti automaticamente
  useEffect(() => {
    if (token) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect]);

  // Ping periodico per keepalive
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Ping ogni 30 secondi

    return () => clearInterval(interval);
  }, [token, sendMessage]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    sendMessage,
    connect,
    disconnect,
  };
}
