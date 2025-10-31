import { useState, memo } from 'react';
import { Contact } from '../../types';

interface ContactCardProps {
  contact: Contact;
  onCall: (contactId: string) => void;
  onRemove?: (contactId: string) => void;
}

export const ContactCard = memo(function ContactCard({ contact, onCall, onRemove }: ContactCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  // ✨ Colori design system
  const statusConfig = {
    online: {
      color: 'bg-success-500',
      ring: 'ring-success-500/20',
      text: 'text-success-600 dark:text-success-400',
      label: 'Online',
    },
    offline: {
      color: 'bg-gray-400',
      ring: 'ring-gray-400/20',
      text: 'text-gray-500 dark:text-gray-400',
      label: 'Offline',
    },
    'in-call': {
      color: 'bg-warning-500',
      ring: 'ring-warning-500/20',
      text: 'text-warning-600 dark:text-warning-400',
      label: 'In chiamata',
    },
    busy: {
      color: 'bg-error-500',
      ring: 'ring-error-500/20',
      text: 'text-error-600 dark:text-error-400',
      label: 'Occupato',
    },
  };

  const status = statusConfig[contact.status];

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-500/50 dark:hover:border-primary-400/50 hover:shadow-lg hover:shadow-primary-500/10 transition-all duration-200 group animate-scale-in">
      <div className="flex items-center gap-4">
        {/* Avatar con status indicator */}
        <div className="relative">
          <div className={`w-16 h-16 rounded-2xl overflow-hidden ring-2 ${status.ring} group-hover:ring-primary-500/30 transition-all duration-200`}>
            {contact.avatar ? (
              <img
                src={contact.avatar}
                alt={contact.username}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-xl">
                {contact.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {/* Status dot con pulse animation */}
          <div className={`absolute -bottom-1 -right-1 w-5 h-5 ${status.color} rounded-full border-3 border-white dark:border-gray-900 ${contact.status === 'online' ? 'animate-pulse' : ''}`}>
            <div className={`absolute inset-0 ${status.color} rounded-full ${contact.status === 'online' ? 'animate-ping opacity-75' : ''}`} />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg">
              {contact.username}
            </h3>
            {contact.isFavorite && (
              <svg className="w-4 h-4 text-warning-500 flex-shrink-0 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
          <p className={`text-sm font-medium ${status.text}`}>
            {status.label}
          </p>
        </div>

        {/* Call buttons */}
        <div className="flex gap-2">
          {contact.status === 'online' ? (
            <>
              {/* Audio call */}
              <button
                onClick={() => onCall(contact.id)}
                className="p-3 bg-success-500 hover:bg-success-600 active:bg-success-700 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-success-500/30 hover:shadow-xl hover:shadow-success-500/40 group/btn"
                title="Chiamata audio"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>

              {/* Video call */}
              <button
                onClick={() => onCall(contact.id)}
                className="p-3 bg-primary-500 hover:bg-primary-600 active:bg-primary-700 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 group/btn"
                title="Videochiamata"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </>
          ) : (
            <div className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700/50 rounded-xl text-gray-500 dark:text-gray-400 text-sm font-medium">
              Non disponibile
            </div>
          )}

          {/* Remove friend button */}
          {onRemove && (
            <button
              onClick={() => setShowConfirm(true)}
              className="p-3 bg-error-500/10 hover:bg-error-500 active:bg-error-600 text-error-600 hover:text-white rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 group/btn"
              title="Rimuovi amico"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Confirm delete modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowConfirm(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-error-100 dark:bg-error-900/30 rounded-xl">
                <svg className="w-6 h-6 text-error-600 dark:text-error-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Rimuovi amico</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Sei sicuro?</p>
              </div>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-6">
              Vuoi rimuovere <span className="font-semibold text-gray-900 dark:text-white">{contact.username}</span> dalla tua lista amici? Anche loro non ti vedranno più nella loro lista.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors"
              >
                Annulla
              </button>
              <button
                onClick={() => {
                  if (onRemove) {
                    onRemove(contact.id);
                  }
                  setShowConfirm(false);
                }}
                className="flex-1 px-4 py-2.5 bg-error-500 hover:bg-error-600 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-error-500/30"
              >
                Rimuovi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
