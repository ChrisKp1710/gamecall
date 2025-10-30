import { useEffect, useState } from 'react';

interface CallingScreenProps {
  targetUsername: string;
  targetAvatar?: string;
  onCancel: () => void;
}

export function CallingScreen({ targetUsername, targetAvatar, onCancel }: CallingScreenProps) {
  const [dots, setDots] = useState('.');
  const [isTimeout, setIsTimeout] = useState(false);

  // Animazione puntini
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '.';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // 🔥 Timeout 60 secondi - se non risponde, cancella automaticamente
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.log('⏱️ Timeout 60s - nessuna risposta');
      setIsTimeout(true);
      
      // Dopo 3 secondi mostra messaggio, poi annulla
      setTimeout(() => {
        onCancel();
      }, 3000);
    }, 60000); // 60 secondi

    return () => clearTimeout(timeoutId);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50">
      <div className="text-center max-w-md px-6">
        {/* Avatar con animazione pulse */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-20" />
          <div className="absolute inset-0 bg-blue-500 rounded-full animate-pulse opacity-30" />
          {targetAvatar ? (
            <img
              src={targetAvatar}
              alt={targetUsername}
              className="relative w-32 h-32 rounded-full border-4 border-blue-500 mx-auto"
            />
          ) : (
            <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-5xl font-bold border-4 border-blue-500 mx-auto">
              {targetUsername.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Nome utente */}
        <h2 className="text-3xl font-bold text-white mb-3">
          {targetUsername}
        </h2>

        {/* Stato chiamata con animazione */}
        <div className="mb-8">
          {isTimeout ? (
            <>
              <p className="text-xl text-red-400 mb-1 flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Non risponde
              </p>
              <p className="text-sm text-gray-500">
                {targetUsername} non è disponibile
              </p>
            </>
          ) : (
            <>
              <p className="text-xl text-gray-300 mb-1">
                Chiamata in corso{dots}
              </p>
              <p className="text-sm text-gray-500">
                In attesa di risposta
              </p>
            </>
          )}
        </div>

        {/* Icona videochiamata animata */}
        <div className="mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full animate-pulse">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        {/* Bottone annulla */}
        <button
          onClick={onCancel}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="font-semibold">Annulla</span>
        </button>

        {/* Hint tastiera */}
        <p className="mt-6 text-sm text-gray-600">
          Premi <kbd className="px-2 py-1 bg-gray-800 rounded text-gray-400">Esc</kbd> per annullare
        </p>
      </div>
    </div>
  );
}
