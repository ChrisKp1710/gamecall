import { useState, useEffect } from 'react';

interface CallPreparationProps {
  targetUsername: string;
  onReady: () => void;
  onCancel: () => void;
}

export function CallPreparation({ targetUsername, onReady, onCancel }: CallPreparationProps) {
  const [status, setStatus] = useState<'preparing' | 'checking' | 'ready'>('preparing');

  // 🔥 Animazione automatica degli steps
  useEffect(() => {
    // Step 1: preparing → checking (dopo 1 secondo)
    const timer1 = setTimeout(() => {
      setStatus('checking');
    }, 1000);

    // Step 2: checking → ready (dopo 2 secondi)
    const timer2 = setTimeout(() => {
      setStatus('ready');
    }, 2000);

    // Step 3: ready → avvia chiamata (dopo 2.5 secondi)
    const timer3 = setTimeout(() => {
      onReady();
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onReady]);

  return (
    <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
      <div className="text-center max-w-md">
        {/* Animazione caricamento */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Titolo */}
        <h2 className="text-2xl font-bold text-white mb-2">
          Preparazione chiamata
        </h2>
        <p className="text-gray-400 mb-8">
          Chiamata a <span className="text-white font-semibold">{targetUsername}</span>
        </p>

        {/* Steps */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 text-left bg-gray-800/50 rounded-lg p-3">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              {status === 'preparing' ? (
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              ) : (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className="text-white">Connessione al server...</span>
          </div>

          <div className="flex items-center gap-3 text-left bg-gray-800/50 rounded-lg p-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              status === 'checking' ? 'bg-blue-500' : 'bg-gray-600'
            }`}>
              {status === 'checking' ? (
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              ) : status === 'ready' ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-3 h-3 bg-gray-400 rounded-full" />
              )}
            </div>
            <span className="text-white">Accesso camera e microfono...</span>
          </div>

          <div className="flex items-center gap-3 text-left bg-gray-800/50 rounded-lg p-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
              status === 'ready' ? 'bg-blue-500' : 'bg-gray-600'
            }`}>
              {status === 'ready' ? (
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <div className="w-3 h-3 bg-gray-400 rounded-full" />
              )}
            </div>
            <span className="text-white">Avvio chiamata...</span>
          </div>
        </div>

        {/* Bottone annulla */}
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Annulla
        </button>
      </div>
    </div>
  );
}
