import { useEffect, useRef, useState, useCallback } from 'react';

// Configurazione STUN servers (free Google STUN)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
  ],
};

export interface UseVideoCallOptions {
  contactId: string;
  sendSignal: (toUserId: string, signal: any) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onCallEnded?: () => void;
}

export function useVideoCall({ contactId, sendSignal, onRemoteStream, onCallEnded }: UseVideoCallOptions) {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'disconnected'>('idle');
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'active' | 'ended'>('idle');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Crea peer connection
  const createPeerConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      return peerConnectionRef.current;
    }

    console.log('🔨 [VideoCall] Creazione PeerConnection');
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 [VideoCall] Invio ICE candidate');
        sendSignal(contactId, {
          type: 'ice-candidate',
          candidate: event.candidate.toJSON(),
        });
      }
    };

    // Connection state
    pc.onconnectionstatechange = () => {
      console.log('🔗 [VideoCall] Connection state:', pc.connectionState);
      
      if (pc.connectionState === 'connecting') {
        setConnectionStatus('connecting');
      } else if (pc.connectionState === 'connected') {
        setConnectionStatus('connected');
        setCallStatus('active');
      } else if (pc.connectionState === 'failed' || pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
        setConnectionStatus('disconnected');
        setCallStatus('ended');
        onCallEnded?.();
      }
    };

    // Remote stream
    pc.ontrack = (event) => {
      console.log('📺 [VideoCall] Stream remoto ricevuto');
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        onRemoteStream?.(event.streams[0]);
      }
    };

    return pc;
  }, [contactId, sendSignal, onRemoteStream, onCallEnded]);

  // Gestisci segnali ricevuti
  const handleSignal = useCallback(async (fromUserId: string, signal: any) => {
    if (fromUserId !== contactId) return;

    console.log('📨 [VideoCall] Segnale ricevuto:', signal.type);

    const pc = peerConnectionRef.current || createPeerConnection();

    try {
      if (signal.type === 'video-offer') {
        console.log('📩 [VideoCall] Ricevuto offer, creazione answer');
        setCallStatus('calling');
        
        await pc.setRemoteDescription(new RTCSessionDescription(signal));

        // Aggiungi candidati in coda
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log('📤 [VideoCall] Invio answer');
        sendSignal(contactId, { ...answer, type: 'video-answer' });
      } else if (signal.type === 'video-answer') {
        console.log('📩 [VideoCall] Ricevuto answer');
        await pc.setRemoteDescription(new RTCSessionDescription(signal));

        // Aggiungi candidati in coda
        for (const candidate of pendingCandidatesRef.current) {
          await pc.addIceCandidate(candidate);
        }
        pendingCandidatesRef.current = [];
      } else if (signal.type === 'ice-candidate' && signal.candidate) {
        console.log('🧊 [VideoCall] Ricevuto ICE candidate');
        const candidate = new RTCIceCandidate(signal.candidate);
        
        if (pc.remoteDescription) {
          await pc.addIceCandidate(candidate);
        } else {
          pendingCandidatesRef.current.push(candidate);
        }
      }
    } catch (error) {
      console.error('❌ [VideoCall] Errore gestione segnale:', error);
    }
  }, [contactId, createPeerConnection, sendSignal]);

  // Inizia chiamata (caller)
  const startCall = useCallback(async (localStream: MediaStream) => {
    try {
      console.log('🚀 [VideoCall] Inizio chiamata a', contactId);
      setConnectionStatus('connecting');
      setCallStatus('calling');

      localStreamRef.current = localStream;
      const pc = createPeerConnection();

      // Aggiungi tracks locali
      localStream.getTracks().forEach(track => {
        console.log('➕ [VideoCall] Aggiungo track:', track.kind);
        pc.addTrack(track, localStream);
      });

      // Crea offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      console.log('📤 [VideoCall] Invio offer');
      sendSignal(contactId, { ...offer, type: 'video-offer' });
    } catch (error) {
      console.error('❌ [VideoCall] Errore avvio chiamata:', error);
      setConnectionStatus('disconnected');
      setCallStatus('ended');
    }
  }, [contactId, createPeerConnection, sendSignal]);

  // Rispondi a chiamata (callee)
  const answerCall = useCallback(async (localStream: MediaStream) => {
    try {
      console.log('✅ [VideoCall] Rispondo alla chiamata');
      localStreamRef.current = localStream;
      const pc = peerConnectionRef.current;

      if (!pc) {
        console.error('❌ [VideoCall] Nessuna PeerConnection disponibile');
        return;
      }

      // Aggiungi tracks locali
      localStream.getTracks().forEach(track => {
        console.log('➕ [VideoCall] Aggiungo track:', track.kind);
        pc.addTrack(track, localStream);
      });
    } catch (error) {
      console.error('❌ [VideoCall] Errore risposta chiamata:', error);
      setConnectionStatus('disconnected');
      setCallStatus('ended');
    }
  }, []);

  // Termina chiamata
  const endCall = useCallback(() => {
    console.log('📞 [VideoCall] Termino chiamata');

    // Ferma stream locale
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        console.log(`🛑 [VideoCall] Fermando track: ${track.kind}`);
        track.stop();
      });
      localStreamRef.current = null;
    }

    // Ferma stream remoto
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        track.stop();
      });
      setRemoteStream(null);
    }

    // Chiudi peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    pendingCandidatesRef.current = [];
    setConnectionStatus('disconnected');
    setCallStatus('ended');
    onCallEnded?.();
  }, [remoteStream, onCallEnded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      endCall();
    };
  }, [contactId]);

  return {
    connectionStatus,
    callStatus,
    remoteStream,
    startCall,
    answerCall,
    endCall,
    handleSignal,
  };
}
