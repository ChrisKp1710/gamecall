import { useEffect } from 'react';

interface ChatNotificationToastProps {
  fromUsername: string;
  fromAvatar?: string;
  onOpenChat: () => void;
  onClose: () => void;
  autoCloseDelay?: number; // ms, default 10000 (10 secondi)
}

export function ChatNotificationToast({
  fromUsername,
  fromAvatar,
  onOpenChat,
  onClose,
  autoCloseDelay = 10000,
}: ChatNotificationToastProps) {
  // Auto-close dopo delay
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [autoCloseDelay, onClose]);

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in-right">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 min-w-[320px] max-w-[400px]">
        {/* Header con close button */}
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 flex-shrink-0">
            {fromAvatar ? (
              <img src={fromAvatar} alt={fromUsername} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-lg">
                {fromUsername.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                  {fromUsername}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  vuole chattare con te
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                title="Chiudi"
              >
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Action button */}
            <button
              onClick={() => {
                onOpenChat();
                onClose();
              }}
              className="w-full mt-3 px-4 py-2 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors shadow-lg shadow-primary-500/30"
            >
              Apri chat
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 animate-progress-bar"
            style={{ animationDuration: `${autoCloseDelay}ms` }}
          />
        </div>
      </div>
    </div>
  );
}
