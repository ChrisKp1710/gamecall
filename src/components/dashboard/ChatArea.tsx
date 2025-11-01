import { useState, useEffect, useCallback, useRef } from 'react';
import { Contact } from '../../types';
import { useWebRTC, Message } from '../../hooks/useWebRTC';
import { useWebSocket } from '../../hooks/useWebSocket';

interface ChatAreaProps {
  selectedContact: Contact | null;
  onRemoveFriend: (friendId: string) => void;
}

export function ChatArea({ selectedContact, onRemoveFriend }: ChatAreaProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);

  // Ref per webrtc (per evitare dipendenze circolari)
  const webrtcRef = useRef<ReturnType<typeof useWebRTC> | null>(null);

  // WebSocket per signaling
  const { sendMessage: sendWsMessage } = useWebSocket({
    onWebRTCSignal: useCallback(async (fromUserId: string, signal: any) => {
      if (webrtcRef.current) {
        await webrtcRef.current.handleSignal(fromUserId, signal);
      }
    }, []),
  });

  // WebRTC per messaggi P2P
  const webrtc = useWebRTC({
    contactId: selectedContact?.id || '',
    onMessageReceived: useCallback((msg: Message) => {
      setMessages(prev => [...prev, msg]);
    }, []),
    sendSignal: useCallback((toUserId: string, signal: any) => {
      sendWsMessage({
        type: 'webrtc_signal',
        from_user_id: '', // Viene impostato dal server
        to_user_id: toUserId,
        signal,
      });
    }, [sendWsMessage]),
  });

  // Salva ref per callback WebSocket
  webrtcRef.current = webrtc;

  // Reset messages quando cambia contatto
  useEffect(() => {
    setMessages([]);
  }, [selectedContact?.id]);

  // Auto-connetti quando selezionato contatto online
  useEffect(() => {
    if (selectedContact && selectedContact.status === 'online' && !webrtc.isConnected && !webrtc.isConnecting) {
      console.log('📞 [Chat] Auto-connessione a', selectedContact.username);
      webrtc.connect();
    }
  }, [selectedContact, webrtc]);

  const handleSendMessage = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !selectedContact) return;

    const sent = webrtc.sendMessage(message.trim());
    if (sent) {
      // Aggiungi messaggio locale
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        senderId: 'me',
        content: message.trim(),
        timestamp: new Date(),
        isMe: true,
      }]);
      setMessage('');
    } else {
      // TODO: Fallback a server se P2P non disponibile
      console.warn('⚠️ [Chat] P2P non disponibile, messaggio non inviato');
      alert('Connessione P2P non disponibile. Assicurati che entrambi siate online.');
    }
  }, [message, selectedContact, webrtc]);

  // Stato vuoto - nessun contatto selezionato
  if (!selectedContact) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <svg className="w-32 h-32 text-gray-300 dark:text-gray-700 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Benvenuto in GameCall</h2>
          <p className="text-gray-500 dark:text-gray-400">Seleziona un amico per iniziare a chattare</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
      {/* Header Chat */}
      <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500">
              {selectedContact.avatar ? (
                <img src={selectedContact.avatar} alt={selectedContact.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold">
                  {selectedContact.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
              selectedContact.status === 'online' ? 'bg-success-500' : 'bg-gray-400'
            }`} />
          </div>

          {/* Nome e stato */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{selectedContact.username}</h3>
              {webrtc.isConnected && (
                <span className="flex items-center gap-1 text-xs text-success-500">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <circle cx="10" cy="10" r="4" />
                  </svg>
                  P2P
                </span>
              )}
              {webrtc.isConnecting && (
                <span className="text-xs text-warning-500">Connessione...</span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {selectedContact.status === 'online' ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* P2P Connect button */}
          {!webrtc.isConnected && selectedContact.status === 'online' && (
            <button
              onClick={webrtc.connect}
              disabled={webrtc.isConnecting}
              className="px-3 py-1.5 text-xs font-medium bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
              title="Connetti P2P"
            >
              {webrtc.isConnecting ? 'Connessione...' : 'Connetti'}
            </button>
          )}

          {/* Voice call */}
          <button
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Chiamata vocale"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>

          {/* Video call */}
          <button
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Videochiamata"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Remove friend */}
          <button
            onClick={() => onRemoveFriend(selectedContact.id)}
            className="p-2 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors"
            title="Rimuovi amico"
          >
            <svg className="w-5 h-5 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Area messaggi */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-20 h-20 text-gray-300 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">Nessun messaggio ancora</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              {webrtc.isConnected ? 'Inizia una conversazione P2P criptata!' : 'Connetti P2P per iniziare'}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-2xl ${
                  msg.isMe
                    ? 'bg-primary-500 text-white rounded-br-sm'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {msg.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input messaggio */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
        {!webrtc.isConnected ? (
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            Connetti P2P per inviare messaggi criptati
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Scrivi un messaggio P2P..."
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 border-0 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              type="submit"
              disabled={!message.trim()}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full font-medium transition-colors disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
