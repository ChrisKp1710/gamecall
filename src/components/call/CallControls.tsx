import { useCallStore } from '../../stores/callStore';

interface CallControlsProps {
  onEndCall: () => void;
  onToggleMic: () => void;
  onToggleVideo: () => void;
  onToggleScreenShare?: () => void;
  onTogglePip?: () => void;
  callDuration?: number;
}

export function CallControls({
  onEndCall,
  onToggleMic,
  onToggleVideo,
  onToggleScreenShare,
  onTogglePip,
  callDuration = 0,
}: CallControlsProps) {
  const {
    isMuted,
    isVideoOff,
    isSharingScreen,
    isPictureInPicture,
  } = useCallStore();

  const formatDuration = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-900/95 backdrop-blur-lg border-t border-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Timer e Info */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center gap-2 bg-gray-800/50 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-white font-mono text-sm">{formatDuration(callDuration)}</span>
          </div>
        </div>

        {/* Controlli principali */}
        <div className="flex items-center justify-center gap-4">
          {/* Mute/Unmute Audio */}
          <button
            onClick={onToggleMic}
            className={`group relative p-4 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
              isMuted
                ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50'
                : 'bg-gray-700 hover:bg-gray-600 shadow-lg'
            }`}
            title={isMuted ? 'Attiva microfono' : 'Disattiva microfono'}
          >
            {isMuted ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
            {/* Tooltip */}
            <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isMuted ? 'Attiva mic' : 'Disattiva mic'}
            </span>
          </button>

          {/* Toggle Video */}
          <button
            onClick={onToggleVideo}
            className={`group relative p-4 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
              isVideoOff
                ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50'
                : 'bg-gray-700 hover:bg-gray-600 shadow-lg'
            }`}
            title={isVideoOff ? 'Attiva video' : 'Disattiva video'}
          >
            {isVideoOff ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              {isVideoOff ? 'Attiva video' : 'Disattiva video'}
            </span>
          </button>

          {/* Screen Share */}
          {onToggleScreenShare && (
            <button
              onClick={onToggleScreenShare}
              className={`group relative p-4 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                isSharingScreen
                  ? 'bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/50'
                  : 'bg-gray-700 hover:bg-gray-600 shadow-lg'
              }`}
              title={isSharingScreen ? 'Stop condivisione' : 'Condividi schermo'}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {isSharingScreen ? 'Stop share' : 'Condividi schermo'}
              </span>
            </button>
          )}

          {/* Picture in Picture */}
          {onTogglePip && (
            <button
              onClick={onTogglePip}
              className={`group relative p-4 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 ${
                isPictureInPicture
                  ? 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/50'
                  : 'bg-gray-700 hover:bg-gray-600 shadow-lg'
              }`}
              title={isPictureInPicture ? 'Disattiva PIP' : 'Attiva PIP'}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
              </svg>
              <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Picture-in-Picture
              </span>
            </button>
          )}

          {/* End Call - Più grande e centrale */}
          <button
            onClick={onEndCall}
            className="group relative p-5 bg-red-600 hover:bg-red-700 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-2xl shadow-red-500/50 ml-4"
            title="Termina chiamata"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
            <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Termina chiamata
            </span>
          </button>

          {/* Settings */}
          <button
            className="group relative p-4 bg-gray-700 hover:bg-gray-600 rounded-full transition-all duration-200 hover:scale-110 active:scale-95 shadow-lg ml-4"
            title="Impostazioni"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
              Impostazioni
            </span>
          </button>
        </div>

        {/* Keyboard shortcuts info */}
        <div className="text-center mt-4">
          <p className="text-gray-500 text-xs">
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 text-[10px]">M</kbd> Mute • 
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 text-[10px] ml-2">V</kbd> Video • 
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 text-[10px] ml-2">S</kbd> Screen • 
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 text-[10px] ml-2">Esc</kbd> Termina
          </p>
        </div>
      </div>
    </div>
  );
}
