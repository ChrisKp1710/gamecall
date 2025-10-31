import { User } from '../../types';

interface ProfilePanelProps {
  user: User | null;
  onClose: () => void;
}

export function ProfilePanel({ user, onClose }: ProfilePanelProps) {
  if (!user) return null;

  return (
    <div className="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="h-16 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
        <h2 className="font-semibold text-gray-900 dark:text-white">Profilo</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Avatar grande */}
        <div className="p-6 flex flex-col items-center border-b border-gray-200 dark:border-gray-700">
          <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary-500 to-accent-500 mb-4">
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{user.username}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Online</p>
        </div>

        {/* Info utente */}
        <div className="p-4 space-y-4">
          {/* Friend Code */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">
              Codice Amico
            </label>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono text-gray-900 dark:text-white bg-white dark:bg-gray-800 px-3 py-1.5 rounded border border-gray-200 dark:border-gray-700">
                {user.friendCode}
              </code>
              <button
                onClick={() => {
                  if (user.friendCode) {
                    navigator.clipboard.writeText(user.friendCode);
                    // TODO: Mostrare toast di conferma
                  }
                }}
                className="ml-2 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Copia codice"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              Condividi questo codice per farti aggiungere come amico
            </p>
          </div>

          {/* Sezioni impostazioni */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Impostazioni
            </h4>

            {/* Account */}
            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-sm text-gray-900 dark:text-white">Account</span>
            </button>

            {/* Privacy */}
            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-sm text-gray-900 dark:text-white">Privacy</span>
            </button>

            {/* Notifiche */}
            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="text-sm text-gray-900 dark:text-white">Notifiche</span>
            </button>

            {/* Aspetto */}
            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              <span className="text-sm text-gray-900 dark:text-white">Aspetto</span>
            </button>
          </div>

          {/* Info app */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Informazioni
            </h4>
            <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-900 rounded-lg transition-colors">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-gray-900 dark:text-white">Centro assistenza</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
