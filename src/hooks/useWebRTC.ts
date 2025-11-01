import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Configurazione STUN servers (free Google STUN)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isMe: boolean;
}

export interface UseWebRTCOptions {
  contactId: string;
  onMessageReceived?: (message: Message) => void;
  sendSignal: (toUserId: string, signal: any) => void;
  onSignalReceived?: (fromUserId: string, signal: any) => Promise<void>;
}

export function useWebRTC({ contactId, onMessageReceived, sendSignal }: UseWebRTCOptions) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);

  // Setup data channel
  const setupDataChannel = useCallback((channel: RTCDataChannel) => {
    dataChannelRef.current = channel;

    channel.onopen = () => {
      console.log('✅ [WebRTC] Data channel aperto');
      setIsConnected(true);
      setIsConnecting(false);
    };

    channel.onclose = () => {
      console.log('❌ [WebRTC] Data channel chiuso');
      setIsConnected(false);
    };

    channel.onmessage = (event) => {
      try {
        const rawMessage = JSON.parse(event.data);
        console.log('📩 [WebRTC] Messaggio ricevuto (raw):', rawMessage);

        // Converti timestamp da stringa a Date object
        const message: Message = {
          ...rawMessage,
          timestamp: new Date(rawMessage.timestamp),
          isMe: false,
        };

        console.log('📩 [WebRTC] Messaggio elaborato:', message);
        onMessageReceived?.(message);
      } catch (error) {
        console.error('❌ [WebRTC] Errore parsing messaggio:', error);
      }
    };
  }, [onMessageReceived]);

  // Crea peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    console.log('🔨 [WebRTC] Creazione PeerConnection');
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 [WebRTC] Invio ICE candidate');
        sendSignal(contactId, {
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      console.log('🔗 [WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        setIsConnected(true);
        setIsConnecting(false);
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected') {
        setIsConnected(false);
        setIsConnecting(false);
      }
    };

    // Data channel (se ricevuto da peer)
    pc.ondatachannel = (event) => {
      console.log('📥 [WebRTC] Data channel ricevuto');
      setupDataChannel(event.channel);
    };

    return pc;
  }, [contactId, sendSignal, setupDataChannel]);

  // Gestisci segnali ricevuti
  const handleSignal = useCallback(async (fromUserId: string, signal: any) => {
    if (fromUserId !== contactId) return;

    console.log('📨 [WebRTC] Segnale ricevuto:', signal.type || 'candidate');

    const pc = peerConnectionRef.current || createPeerConnection();

    try {
      if (signal.type === 'offer') {
        console.log('📩 [WebRTC] Ricevuto offer, creazione answer');
        await pc.setRemoteDescription(new RTCSessionDescription(signal));

        // Aggiungi candidati in coda
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log('📤 [WebRTC] Invio answer');
        sendSignal(contactId, answer);
      } else if (signal.type === 'answer') {
        console.log('📩 [WebRTC] Ricevuto answer');
        await pc.setRemoteDescription(new RTCSessionDescription(signal));

        // Aggiungi candidati in coda
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];
      } else if (signal.candidate) {
        console.log('🧊 [WebRTC] Ricevuto ICE candidate');
        if (pc.remoteDescription) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        } else {
          pendingCandidatesRef.current.push(new RTCIceCandidate(signal.candidate));
        }
      }
    } catch (error) {
      console.error('❌ [WebRTC] Errore gestione segnale:', error);
    }
  }, [contactId, createPeerConnection, sendSignal]);

  // Inizia connessione (caller)
  const connect = useCallback(async () => {
    try {
      console.log('🚀 [WebRTC] Inizio connessione a', contactId);
      setIsConnecting(true);

      const pc = createPeerConnection();

      // Crea data channel
      const channel = pc.createDataChannel('messages', {
        ordered: true,
      });
      setupDataChannel(channel);

      // Crea offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log('📤 [WebRTC] Invio offer');
      sendSignal(contactId, offer);
    } catch (error) {
      console.error('❌ [WebRTC] Errore connessione:', error);
      setIsConnecting(false);
    }
  }, [contactId, createPeerConnection, setupDataChannel, sendSignal]);

  // Invia messaggio
  const sendMessage = useCallback((content: string): boolean => {
    if (!dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      console.warn('⚠️ [WebRTC] Data channel non aperto');
      return false;
    }

    if (!user) {
      console.warn('⚠️ [WebRTC] User non disponibile');
      return false;
    }

    const message: Message = {
      id: crypto.randomUUID(),
      senderId: user.id,
      content,
      timestamp: new Date(),
      isMe: true,
    };

    try {
      dataChannelRef.current.send(JSON.stringify(message));
      console.log('📤 [WebRTC] Messaggio inviato');
      return true;
    } catch (error) {
      console.error('❌ [WebRTC] Errore invio messaggio:', error);
      return false;
    }
  }, [user]);

  // Disconnect
  const disconnect = useCallback(() => {
    console.log('🔌 [WebRTC] Disconnessione');
    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    pendingCandidatesRef.current = [];
  }, []);

  // Cleanup on unmount o cambio contatto
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [contactId, disconnect]);

  return {
    isConnected,
    isConnecting,
    connect,
    sendMessage,
    disconnect,
    handleSignal,
  };
}
