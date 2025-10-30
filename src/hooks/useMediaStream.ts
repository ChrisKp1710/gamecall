import { useState, useEffect, useRef, useCallback } from 'react';

export interface MediaStreamState {
  stream: MediaStream | null;
  error: string | null;
  warning: string | null; // ⚠️ Warning non fatale (es. mic occupato)
  isLoading: boolean;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  devices: {
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
    audioOutputs: MediaDeviceInfo[];
  };
}

export function useMediaStream() {
  const [state, setState] = useState<MediaStreamState>({
    stream: null,
    error: null,
    warning: null,
    isLoading: false,
    isAudioEnabled: true,
    isVideoEnabled: true,
    devices: {
      audioInputs: [],
      videoInputs: [],
      audioOutputs: [],
    },
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Carica lista dispositivi disponibili
  const loadDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      setState(prev => ({
        ...prev,
        devices: {
          audioInputs: devices.filter(d => d.kind === 'audioinput'),
          videoInputs: devices.filter(d => d.kind === 'videoinput'),
          audioOutputs: devices.filter(d => d.kind === 'audiooutput'),
        },
      }));
    } catch (err) {
      console.error('Errore caricamento dispositivi:', err);
    }
  }, []);

  // Avvia stream media
  const startStream = useCallback(async (
    audio: boolean | MediaTrackConstraints = true,
    video: boolean | MediaTrackConstraints = true
  ): Promise<MediaStream | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Configurazione video ottimizzata
      const videoConstraints = video ? {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
        facingMode: 'user',
        ...(typeof video === 'object' ? video : {}),
      } : false;

      // Configurazione audio ottimizzata
      const audioConstraints = audio ? {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...(typeof audio === 'object' ? audio : {}),
      } : false;

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: videoConstraints,
      });

      streamRef.current = mediaStream;

      // Collega stream al video element se disponibile
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      setState(prev => ({
        ...prev,
        stream: mediaStream,
        isLoading: false,
        isAudioEnabled: audio !== false,
        isVideoEnabled: video !== false,
      }));

      // Ricarica lista dispositivi dopo aver ottenuto permessi
      await loadDevices();

      return mediaStream;
    } catch (err) {
      let errorMessage = 'Errore sconosciuto';
      let isWarning = false; // 🔥 Distingue tra warning e errore fatale

      if (err instanceof DOMException) {
        switch (err.name) {
          case 'NotAllowedError':
            errorMessage = 'Permessi camera/microfono negati. Abilita i permessi nelle impostazioni del browser.';
            break;
          case 'NotFoundError':
            errorMessage = 'Nessuna camera o microfono trovato. Verifica che i dispositivi siano connessi.';
            break;
          case 'NotReadableError':
            // ⚠️ CASO SPECIALE: Dispositivo già in uso
            // Proviamo a ripartire SOLO con video (senza audio)
            if (audio !== false) {
              console.warn('⚠️ Microfono occupato, riprovo senza audio...');
              try {
                const videoOnlyStream = await navigator.mediaDevices.getUserMedia({
                  audio: false,
                  video: typeof video === 'object' ? video : {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 },
                    facingMode: 'user',
                  },
                });

                streamRef.current = videoOnlyStream;
                if (videoRef.current) {
                  videoRef.current.srcObject = videoOnlyStream;
                }

                setState(prev => ({
                  ...prev,
                  stream: videoOnlyStream,
                  isLoading: false,
                  isAudioEnabled: false,
                  isVideoEnabled: video !== false,
                  warning: '⚠️ Microfono già in uso da un\'altra applicazione. Chiamata avviata solo con video.',
                }));

                await loadDevices();
                return videoOnlyStream;
              } catch (retryErr) {
                console.error('❌ Fallito anche con solo video:', retryErr);
                errorMessage = 'Camera o microfono già in uso da un\'altra applicazione.';
              }
            } else {
              errorMessage = 'Camera o microfono già in uso da un\'altra applicazione.';
            }
            break;
          case 'OverconstrainedError':
            errorMessage = 'Impossibile soddisfare le richieste per camera/microfono.';
            break;
          case 'SecurityError':
            errorMessage = 'Accesso ai dispositivi bloccato per motivi di sicurezza.';
            break;
          default:
            errorMessage = `Errore: ${err.message}`;
        }
      }

      setState(prev => ({
        ...prev,
        stream: null,
        isLoading: false,
        error: isWarning ? null : errorMessage,
        warning: isWarning ? errorMessage : null,
      }));

      return null;
    }
  }, [loadDevices]);

  // Ferma stream
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      setState(prev => ({
        ...prev,
        stream: null,
        isAudioEnabled: false,
        isVideoEnabled: false,
      }));
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback((): boolean => {
    if (!streamRef.current) return false;

    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setState(prev => ({ ...prev, isAudioEnabled: audioTrack.enabled }));
      return audioTrack.enabled;
    }

    return false;
  }, []);

  // Toggle video
  const toggleVideo = useCallback((): boolean => {
    if (!streamRef.current) return false;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      return videoTrack.enabled;
    }

    return false;
  }, []);

  // Cambia dispositivo audio input
  const switchAudioInput = useCallback(async (deviceId: string) => {
    if (!streamRef.current) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false,
      });

      const oldAudioTrack = streamRef.current.getAudioTracks()[0];
      const newAudioTrack = newStream.getAudioTracks()[0];

      streamRef.current.removeTrack(oldAudioTrack);
      streamRef.current.addTrack(newAudioTrack);
      oldAudioTrack.stop();

      setState(prev => ({ ...prev, stream: streamRef.current }));
    } catch (err) {
      console.error('Errore cambio dispositivo audio:', err);
    }
  }, []);

  // Cambia dispositivo video
  const switchVideoInput = useCallback(async (deviceId: string) => {
    if (!streamRef.current) return;

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { deviceId: { exact: deviceId } },
      });

      const oldVideoTrack = streamRef.current.getVideoTracks()[0];
      const newVideoTrack = newStream.getVideoTracks()[0];

      streamRef.current.removeTrack(oldVideoTrack);
      streamRef.current.addTrack(newVideoTrack);
      oldVideoTrack.stop();

      if (videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }

      setState(prev => ({ ...prev, stream: streamRef.current }));
    } catch (err) {
      console.error('Errore cambio dispositivo video:', err);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  // Carica dispositivi all'avvio
  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  return {
    ...state,
    videoRef,
    startStream,
    stopStream,
    toggleAudio,
    toggleVideo,
    switchAudioInput,
    switchVideoInput,
    loadDevices,
  };
}
