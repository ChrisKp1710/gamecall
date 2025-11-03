import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let success = false;
      if (isLogin) {
        success = await login(username, password);
      } else {
        success = await register(username, password);
      }

      if (success) {
        // Crea e apri finestra main (dashboard) CON decorazioni
        const mainWindow = new WebviewWindow('main', {
          url: '/',
          title: 'GameCall',
          width: 1200,
          height: 800,
          decorations: true,
          resizable: true,
          center: true,
        });

        // Attendi che la finestra sia pronta
        await new Promise((resolve) => {
          mainWindow.once('tauri://created', () => {
            resolve(true);
          });
          mainWindow.once('tauri://error', () => {
            resolve(false);
          });
        });

        // Chiudi finestra login
        const loginWindow = getCurrentWindow();
        await loginWindow.close();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="h-screen flex items-center justify-center bg-gray-50 dark:bg-[#1e1f22] overflow-hidden"
    >
      {/* Card principale - NON trascinabile */}
      <div className="w-full h-full flex items-center justify-center p-6">
        <div
          className="bg-white dark:bg-[#2b2d31] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full"
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header con logo */}
          <div className="px-6 py-6 text-center border-b border-gray-100 dark:border-gray-700">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 dark:bg-blue-500 rounded-xl mb-4">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {isLogin ? 'Accedi a GameCall' : 'Crea un account'}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLogin ? 'Bentornato, inserisci le tue credenziali' : 'Compila i campi per iniziare'}
            </p>
          </div>

          {/* Form */}
          <div className="px-6 py-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-white dark:bg-[#1e1f22] text-gray-900 dark:text-white text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Il tuo username"
                  required
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-[#1e1f22] text-gray-900 dark:text-white text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="La tua password"
                  required
                  minLength={8}
                  disabled={isLoading}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                {!isLogin && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Minimo 8 caratteri
                  </p>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-medium rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Caricamento...
                  </span>
                ) : isLogin ? (
                  'Accedi'
                ) : (
                  'Registrati'
                )}
              </button>
            </form>

            {/* Toggle login/register */}
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                disabled={isLoading}
              >
                {isLogin ? (
                  <>
                    Non hai un account? <span className="font-medium">Registrati</span>
                  </>
                ) : (
                  <>
                    Hai già un account? <span className="font-medium">Accedi</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {/* Footer info */}
          <div className="px-6 py-4 bg-gray-50 dark:bg-[#1e1f22] text-center border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Registrandoti accetti i nostri Termini di Servizio e Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
