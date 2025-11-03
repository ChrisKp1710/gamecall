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
      className="h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1b1e] dark:to-[#2b2d31] overflow-hidden px-8"
    >
      {/* Logo e branding */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 dark:bg-blue-500 rounded-2xl mb-4 shadow-lg">
          <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {isLogin ? 'Accedi a GameCall' : 'Unisciti a GameCall'}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isLogin ? 'Bentornato! Inserisci le tue credenziali' : 'Crea il tuo account per iniziare'}
        </p>
      </div>

      {/* Form */}
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 ml-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full bg-white dark:bg-[#1e1f22] text-gray-900 dark:text-white text-sm border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Il tuo username"
              required
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full bg-white dark:bg-[#1e1f22] text-gray-900 dark:text-white text-sm border border-gray-300 dark:border-gray-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="La tua password"
              required
              minLength={8}
              disabled={isLoading}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            {!isLogin && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-1">
                Minimo 8 caratteri
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs rounded-xl px-4 py-3 flex items-start gap-2">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-semibold rounded-xl px-4 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 mt-6"
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
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            onMouseDown={(e) => e.stopPropagation()}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
            disabled={isLoading}
          >
            {isLogin ? (
              <>Non hai un account? <span className="text-blue-600 dark:text-blue-400">Registrati</span></>
            ) : (
              <>Hai già un account? <span className="text-blue-600 dark:text-blue-400">Accedi</span></>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Registrandoti accetti i nostri{' '}
            <span className="text-gray-500 dark:text-gray-400">Termini di Servizio</span>
            {' '}e{' '}
            <span className="text-gray-500 dark:text-gray-400">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
