import { useEffect, useRef } from 'react';
import { useCallStore } from '../../stores/callStore';

export function IncomingCallModal() {
  const {
    showIncomingCallModal,
    incomingCallData,
    acceptIncomingCall,
    rejectIncomingCall,
  } = useCallStore();

  const audioRef = useRef<HTMLAudioElement>(null);

  // Suona quando arriva chiamata
  useEffect(() => {
    if (showIncomingCallModal && audioRef.current) {
      audioRef.current.loop = true;
      audioRef.current.play().catch(err => {
        console.log('Impossibile riprodurre suono:', err);
      });
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [showIncomingCallModal]);

  if (!showIncomingCallModal || !incomingCallData) {
    return null;
  }

  const { from, callType } = incomingCallData;

  const callTypeText = {
    audio: 'Chiamata audio',
    video: 'Videochiamata',
    screen: 'Condivisione schermo',
  };

  const callTypeIcon = {
    audio: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    video: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    screen: (
      <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  };

  return (
    <>
      {/* Audio di notifica */}
      <audio ref={audioRef} src="/ringtone.mp3" />

      {/* Overlay */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        {/* Modal */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl border border-gray-700 p-8 max-w-md w-full mx-4 animate-in zoom-in duration-300">
          {/* Icona chiamata con animazione pulse */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
              <div className="relative bg-blue-600 p-6 rounded-full text-white">
                {callTypeIcon[callType]}
              </div>
            </div>
          </div>

          {/* Informazioni chiamata */}
          <div className="text-center mb-8">
            <p className="text-gray-400 text-sm mb-2">{callTypeText[callType]} in arrivo</p>
            
            {/* Avatar e nome */}
            <div className="flex flex-col items-center mb-4">
              {from.avatar ? (
                <img
                  src={from.avatar}
                  alt={from.username}
                  className="w-20 h-20 rounded-full border-4 border-blue-500 mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-blue-500 mb-3">
                  {from.username.charAt(0).toUpperCase()}
                </div>
              )}
              <h3 className="text-2xl font-bold text-white">{from.username}</h3>
            </div>

            {/* Status indicator pulsante */}
            <div className="flex items-center justify-center gap-2 text-blue-400">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium">In attesa...</span>
            </div>
          </div>

          {/* Bottoni azione */}
          <div className="flex gap-4">
            {/* Rifiuta */}
            <button
              onClick={rejectIncomingCall}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-red-500/50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Rifiuta</span>
            </button>

            {/* Accetta */}
            <button
              onClick={acceptIncomingCall}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-green-500/50 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Accetta</span>
            </button>
          </div>

          {/* Shortcut info */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-xs">
              <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300">Enter</kbd> per accettare • 
              <kbd className="px-2 py-1 bg-gray-700 rounded text-gray-300 ml-2">Esc</kbd> per rifiutare
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
