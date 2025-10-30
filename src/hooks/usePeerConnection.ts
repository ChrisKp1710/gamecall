import { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection, DataConnection } from 'peerjs';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
export type CallStatus = 'idle' | 'calling' | 'ringing' | 'active' | 'ended';

export interface PeerConnectionState {
  peer: Peer | null;
  peerId: string;
  connectionStatus: ConnectionStatus;
  callStatus: CallStatus;
  call: MediaConnection | null;
  dataConnection: DataConnection | null;
  remoteStream: MediaStream | null;
  error: string | null;
  incomingCall: {
    call: MediaConnection;
    from: string;
  } | null;
}

interface UsePeerConnectionOptions {
  onIncomingCall?: (call: MediaConnection, from: string) => void;
  onCallEnded?: () => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onError?: (error: Error) => void;
}

export function usePeerConnection(userId: string, options: UsePeerConnectionOptions = {}) {
  const [state, setState] = useState<PeerConnectionState>({
    peer: null,
    peerId: '',
    connectionStatus: 'disconnected',
    callStatus: 'idle',
    call: null,
    dataConnection: null,
    remoteStream: null,
    error: null,
    incomingCall: null,
  });

  const peerRef = useRef<Peer | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Inizializza PeerJS
  const initializePeer = useCallback(() => {
    setState(prev => ({ ...prev, connectionStatus: 'connecting', error: null }));

    const peerInstance = new Peer(userId, {
      host: 'localhost',  // Server locale per sviluppo
      port: 9000,
      path: '/',
      secure: false,
      debug: 2,  // Log dettagliati in sviluppo
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      },
    });

    // Connessione aperta
    peerInstance.on('open', (id) => {
      console.log('✅ Peer connesso con ID:', id);
      setState(prev => ({
        ...prev,
        peerId: id,
        connectionStatus: 'connected',
        error: null,
      }));
      reconnectAttemptsRef.current = 0;
    });

    // Errore connessione
    peerInstance.on('error', (err) => {
      console.error('❌ Errore PeerJS:', err);
      
      let errorMessage = 'Errore connessione';
      let shouldReconnect = false;

      switch (err.type) {
        case 'peer-unavailable':
          errorMessage = 'Utente non disponibile o offline';
          break;
        case 'network':
          errorMessage = 'Errore di rete. Verifica la connessione internet.';
          shouldReconnect = true;
          break;
        case 'server-error':
          errorMessage = 'Server non raggiungibile. Verifica che il server PeerJS sia attivo.';
          shouldReconnect = true;
          break;
        case 'socket-error':
          errorMessage = 'Errore WebSocket';
          shouldReconnect = true;
          break;
        case 'socket-closed':
          errorMessage = 'Connessione chiusa';
          shouldReconnect = true;
          break;
        default:
          errorMessage = `Errore: ${err.message}`;
      }

      setState(prev => ({
        ...prev,
        error: errorMessage,
        connectionStatus: shouldReconnect ? 'reconnecting' : 'failed',
      }));

      options.onError?.(err);

      // Tentativo di riconnessione
      if (shouldReconnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
        
        console.log(`🔄 Tentativo riconnessione ${reconnectAttemptsRef.current}/${maxReconnectAttempts} tra ${delay}ms`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          cleanup();
          initializePeer();
        }, delay);
      }
    });

    // Chiamata in arrivo
    peerInstance.on('call', (incomingCall) => {
      console.log('📞 Chiamata in arrivo da:', incomingCall.peer);
      
      setState(prev => ({
        ...prev,
        incomingCall: {
          call: incomingCall,
          from: incomingCall.peer,
        },
        callStatus: 'ringing',
      }));

      options.onIncomingCall?.(incomingCall, incomingCall.peer);
    });

    // Connessione dati in arrivo
    peerInstance.on('connection', (dataConn) => {
      console.log('📨 Data connection da:', dataConn.peer);
      
      dataConn.on('data', (data) => {
        console.log('Dati ricevuti:', data);
        // Qui puoi gestire messaggi chat, etc
      });

      setState(prev => ({ ...prev, dataConnection: dataConn }));
    });

    // Disconnessione
    peerInstance.on('disconnected', () => {
      console.log('⚠️ Peer disconnesso');
      setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
    });

    // Chiusura
    peerInstance.on('close', () => {
      console.log('🔴 Peer chiuso');
      setState(prev => ({
        ...prev,
        connectionStatus: 'disconnected',
        callStatus: 'ended',
      }));
    });

    peerRef.current = peerInstance;
    setState(prev => ({ ...prev, peer: peerInstance }));
  }, [userId, options]);

  // Effettua chiamata
  const makeCall = useCallback((targetPeerId: string, localStream: MediaStream) => {
    if (!peerRef.current) {
      console.error('Peer non inizializzato');
      return;
    }

    console.log('📞 Avvio chiamata verso:', targetPeerId);
    setState(prev => ({ ...prev, callStatus: 'calling', error: null }));

    try {
      const outgoingCall = peerRef.current.call(targetPeerId, localStream);

      outgoingCall.on('stream', (remoteMediaStream) => {
        console.log('✅ Stream remoto ricevuto');
        setState(prev => ({
          ...prev,
          remoteStream: remoteMediaStream,
          callStatus: 'active',
        }));
        options.onRemoteStream?.(remoteMediaStream);
      });

      outgoingCall.on('close', () => {
        console.log('📞 Chiamata terminata');
        setState(prev => ({
          ...prev,
          call: null,
          remoteStream: null,
          callStatus: 'ended',
        }));
        options.onCallEnded?.();
      });

      outgoingCall.on('error', (err) => {
        console.error('❌ Errore chiamata:', err);
        setState(prev => ({
          ...prev,
          error: `Errore chiamata: ${err.message}`,
          callStatus: 'ended',
        }));
      });

      setState(prev => ({ ...prev, call: outgoingCall }));
    } catch (err) {
      console.error('❌ Errore avvio chiamata:', err);
      setState(prev => ({
        ...prev,
        error: 'Impossibile avviare la chiamata',
        callStatus: 'ended',
      }));
    }
  }, [options]);

  // Rispondi a chiamata
  const answerCall = useCallback((localStream: MediaStream) => {
    const { incomingCall } = state;
    
    if (!incomingCall) {
      console.error('Nessuna chiamata in arrivo');
      return;
    }

    console.log('✅ Rispondo alla chiamata');
    incomingCall.call.answer(localStream);

    incomingCall.call.on('stream', (remoteMediaStream) => {
      console.log('✅ Stream remoto ricevuto');
      setState(prev => ({
        ...prev,
        remoteStream: remoteMediaStream,
        callStatus: 'active',
        call: incomingCall.call,
        incomingCall: null,
      }));
      options.onRemoteStream?.(remoteMediaStream);
    });

    incomingCall.call.on('close', () => {
      console.log('📞 Chiamata terminata');
      setState(prev => ({
        ...prev,
        call: null,
        remoteStream: null,
        callStatus: 'ended',
      }));
      options.onCallEnded?.();
    });

    incomingCall.call.on('error', (err) => {
      console.error('❌ Errore chiamata:', err);
      setState(prev => ({
        ...prev,
        error: `Errore chiamata: ${err.message}`,
        callStatus: 'ended',
      }));
    });
  }, [state.incomingCall, options]);

  // Rifiuta chiamata
  const rejectCall = useCallback(() => {
    const { incomingCall } = state;
    
    if (incomingCall) {
      console.log('❌ Chiamata rifiutata');
      incomingCall.call.close();
      setState(prev => ({
        ...prev,
        incomingCall: null,
        callStatus: 'idle',
      }));
    }
  }, [state.incomingCall]);

  // Termina chiamata
  const endCall = useCallback(() => {
    const { call } = state;
    
    if (call) {
      console.log('📞 Termino chiamata');
      call.close();
    }

    setState(prev => ({
      ...prev,
      call: null,
      remoteStream: null,
      callStatus: 'ended',
      incomingCall: null,
    }));
  }, [state.call]);

  // Invia messaggio tramite data connection
  const sendMessage = useCallback((message: any) => {
    const { dataConnection } = state;
    
    if (dataConnection && dataConnection.open) {
      dataConnection.send(message);
    } else {
      console.error('Data connection non disponibile');
    }
  }, [state.dataConnection]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setState({
      peer: null,
      peerId: '',
      connectionStatus: 'disconnected',
      callStatus: 'idle',
      call: null,
      dataConnection: null,
      remoteStream: null,
      error: null,
      incomingCall: null,
    });
  }, []);

  // Inizializza peer all'avvio
  useEffect(() => {
    initializePeer();

    return () => {
      cleanup();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    makeCall,
    answerCall,
    rejectCall,
    endCall,
    sendMessage,
    reconnect: initializePeer,
  };
}
