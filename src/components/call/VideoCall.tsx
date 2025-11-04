import { useEffect, useRef, useState } from 'react';
import { useMediaStream } from '../../hooks/useMediaStream';
import { useVideoCall } from '../../hooks/useVideoCall';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useCallStore } from '../../stores/callStore';
import { CallControls } from './CallControls';
import { Contact } from '../../types';

interface VideoCallProps {
  currentUser: Contact;
  targetUser: Contact;
  onEndCall: () => void;
}

export function VideoCall({ currentUser, targetUser, onEndCall }: VideoCallProps) {
  const {
    stream: localStream,
    videoRef: localVideoRef,
    isLoading: isMediaLoading,
    error: mediaError,
    warning: mediaWarning, // ⚠️ Warning non fatale
    startStream,
    stopStream,
    toggleAudio,
    toggleVideo,
  } = useMediaStream();

  // Ref per handleSignal
  const handleSignalRef = useRef<((fromUserId: string, signal: any) => void) | null>(null);

  const { sendMessage } = useWebSocket({
    onWebRTCSignal: (fromUserId, signal) => {
      // Solo gestisci segnali dal target user
      if (fromUserId === targetUser.id && handleSignalRef.current) {
        console.log('📨 [VideoCall] Ricevuto segnale WebRTC da', targetUser.username);
        handleSignalRef.current(fromUserId, signal);
      }
    },
  });

  const {
    remoteStream,
    connectionStatus,
    callStatus,
    startCall,
    endCall: endVideoCall,
    handleSignal,
  } = useVideoCall({
    contactId: targetUser.id,
    sendSignal: (toUserId, signal) => {
      sendMessage({
        type: 'webrtc_signal',
        from_user_id: currentUser.id,
        to_user_id: toUserId,
        signal,
      });
    },
    onRemoteStream: () => {
      console.log('✅ Stream remoto ricevuto in VideoCall');
    },
    onCallEnded: () => {
      console.log('📞 Chiamata terminata dal peer');
    },
  });

  // Salva handleSignal nel ref per usarlo nel callback WebSocket
  useEffect(() => {
    handleSignalRef.current = handleSignal;
  }, [handleSignal]);

  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callTimeout, setCallTimeout] = useState(false);
  const callTimerRef = useRef<NodeJS.Timeout>();
  const callTimeoutRef = useRef<NodeJS.Timeout>();

  const {
    isMuted,
    isVideoOff,
    toggleMute,
    toggleVideo: toggleVideoStore,
    setCallDuration: setStoreDuration,
  } = useCallStore();

  // Avvia stream locale all'inizio (UNA SOLA VOLTA)
  useEffect(() => {
    console.log('🎥 Avvio stream locale...');
    startStream(true, true);

    return () => {
      console.log('🧹 Cleanup VideoCall component...');

      // Cleanup timer
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }

      // stopStream fa già il cleanup dei tracks
      stopStream();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // SOLO al mount, MAI localStream in dependencies!

  // Collega stream remoto al video element
  useEffect(() => {
    if (remoteStream && remoteVideoRef.current) {
      console.log('📺 Collegamento stream remoto al video element');
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  // Avvia chiamata quando stream locale è pronto
  useEffect(() => {
    if (localStream && callStatus === 'idle') {
      console.log(`📞 Avvio chiamata verso ${targetUser.username} (${targetUser.id})`);
      startCall(localStream);

      // Timeout di 60 secondi se nessuno risponde
      callTimeoutRef.current = setTimeout(() => {
        if (!remoteStream) {
          console.log('⏱️ Timeout chiamata - nessuna risposta dopo 60 secondi');
          setCallTimeout(true);
          
          // Chiudi automaticamente dopo 5 secondi
          setTimeout(() => {
            handleEndCall();
          }, 5000);
        }
      }, 60000); // 60 secondi (1 minuto)
    }

    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStream]); // Solo quando localStream è pronto

  // Timer chiamata
  useEffect(() => {
    if (callStatus === 'active') {
      // Cancella timeout quando chiamata è attiva
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
      setCallTimeout(false);

      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
          setStoreDuration(newDuration);
          return newDuration;
        });
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
      }
    };
  }, [callStatus, setStoreDuration]);

  // Gestori controlli
  const handleToggleMic = () => {
    toggleAudio();
    toggleMute();
  };

  const handleToggleVideo = () => {
    toggleVideo();
    toggleVideoStore();
  };

  const handleEndCall = () => {
    console.log('🔴 Termino chiamata...');
    
    // 🔥 CLEANUP COMPLETO: Ferma stream locale
    if (localStream) {
      localStream.getTracks().forEach(track => {
        console.log(`🛑 Fermando track: ${track.kind}`);
        track.stop();
      });
    }
    
    // Ferma stream remoto se presente
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    // Pulisci timeout
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
    }
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
    }
    
    // Termina connessione WebRTC
    endVideoCall();
    
    // Ferma stream hook
    stopStream();
    
    // Callback dashboard
    onEndCall();
  };

  // Stati di caricamento ed errore
  if (isMediaLoading) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md text-center border border-gray-700 shadow-2xl">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-white text-xl font-bold mb-3">Richiesta Permessi</h3>
          <p className="text-gray-300 mb-2">Accesso a camera e microfono in corso...</p>
          <p className="text-gray-400 text-sm mb-6">Clicca "Consenti" nel popup del browser per continuare</p>
          <div className="flex items-center justify-center gap-2 text-yellow-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm">Attendendo autorizzazione...</span>
          </div>
          <button
            onClick={handleEndCall}
            className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Annulla
          </button>
        </div>
      </div>
    );
  }

  if (mediaError) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md text-center border border-gray-700">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-white text-xl font-bold mb-2">Errore Accesso Media</h3>
          <p className="text-gray-400 mb-6">{mediaError}</p>
          <button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    );
  }

  // Errore connessione WebRTC
  if (connectionStatus === 'disconnected' && callStatus === 'ended' && !remoteStream) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 rounded-2xl p-8 max-w-md text-center border border-gray-700">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" />
            </svg>
          </div>
          <h3 className="text-white text-xl font-bold mb-2">Connessione Terminata</h3>
          <p className="text-gray-400 mb-6">La chiamata è terminata o non è stato possibile connettersi.</p>
          <button
            onClick={handleEndCall}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    );
  }

  // Stato chiamata in corso
  const isConnecting = callStatus === 'calling' || connectionStatus === 'connecting';
  const isActive = callStatus === 'active';

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col">
      {/* ⚠️ Banner warning microfono occupato */}
      {mediaWarning && (
        <div className="bg-yellow-600 text-white px-6 py-3 flex items-center gap-3 shadow-lg">
          <svg className="w-6 h-6 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold">Attenzione</p>
            <p className="text-sm text-yellow-100">{mediaWarning}</p>
          </div>
          <button
            onClick={() => {
              // Rimuovi warning dopo click (opzionale)
              console.log('⚠️ Warning acknowledged');
            }}
            className="text-yellow-100 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-lg border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            {targetUser.avatar ? (
              <img src={targetUser.avatar} alt={targetUser.username} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                {targetUser.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h2 className="text-white font-semibold">{targetUser.username}</h2>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                <span className="text-sm text-gray-400">
                  {isConnecting ? 'Connessione...' : isActive ? 'In chiamata' : 'Attesa'}
                </span>
              </div>
            </div>
          </div>

          {/* Status Debug (solo sviluppo) */}
          <div className="text-xs text-gray-500 font-mono">
            {connectionStatus} | {callStatus}
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="flex-1 relative p-6 overflow-hidden">
        {/* Video Remoto (Grande) */}
        <div className="absolute inset-6 rounded-2xl overflow-hidden bg-gray-800 shadow-2xl">
          {remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                {callTimeout ? (
                  <>
                    <div className="w-24 h-24 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    </div>
                    <p className="text-white text-xl font-semibold mb-2">{targetUser.username} non risponde</p>
                    <p className="text-gray-400 text-sm">Chiusura automatica...</p>
                  </>
                ) : isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4" />
                    <p className="text-white text-xl">Connessione a {targetUser.username}...</p>
                    <p className="text-gray-400 text-sm mt-2">In attesa di risposta...</p>
                    <button
                      onClick={handleEndCall}
                      className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Annulla chiamata
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4">
                      {targetUser.username.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-gray-400">In attesa del video...</p>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Video Locale (PIP) */}
          <div className="absolute bottom-6 right-6 w-64 h-48 rounded-xl overflow-hidden bg-gray-900 shadow-2xl border-2 border-gray-700">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover mirror"
            />
            {isVideoOff && (
              <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
            <div className="absolute bottom-2 left-2 bg-gray-900/80 backdrop-blur-sm px-2 py-1 rounded text-white text-xs">
              Tu
            </div>
            {isMuted && (
              <div className="absolute top-2 right-2 bg-red-500 p-1.5 rounded-full">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controlli */}
      <CallControls
        onEndCall={handleEndCall}
        onToggleMic={handleToggleMic}
        onToggleVideo={handleToggleVideo}
        callDuration={callDuration}
      />

      {/* CSS per effetto mirror */}
      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
