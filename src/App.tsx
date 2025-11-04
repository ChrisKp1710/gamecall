import { useAuth } from './contexts/AuthContext';
import { Login } from './components/auth/Login';
import { NewDashboard } from './components/dashboard/NewDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useEffect, useState, useRef } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';

function App() {
  const { isAuthenticated, isLoading, token } = useAuth();
  const [windowLabel, setWindowLabel] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState(true);
  const hasHandledAuth = useRef(false);

  // Gestione finestre basata su autenticazione
  useEffect(() => {
    const initializeApp = async () => {
      const window = getCurrentWindow();
      const label = window.label;
      setWindowLabel(label);

      // Se siamo nella finestra login e l'utente è già autenticato
      if (label === 'login' && token && !hasHandledAuth.current) {
        hasHandledAuth.current = true;

        // Utente già loggato, crea finestra main e chiudi login
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
        await window.close();
        return;
      }

      setIsInitializing(false);
    };

    if (!isLoading) {
      initializeApp();
    }
  }, [isLoading, token]);

  // Gestione transizione dopo login manuale
  useEffect(() => {
    const handleLoginSuccess = async () => {
      const window = getCurrentWindow();
      const label = window.label;

      // Se login appena effettuato nella finestra login
      if (label === 'login' && isAuthenticated && !isLoading && !hasHandledAuth.current) {
        hasHandledAuth.current = true;

        // Crea finestra main
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
        await window.close();
      }
    };

    handleLoginSuccess();
  }, [isAuthenticated, isLoading]);

  // Previeni flash di contenuto durante caricamento
  useEffect(() => {
    // Sincronizza tema con system preference
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Mostra loader durante verifica autenticazione iniziale o inizializzazione
  if (isLoading || isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Router: mostra il componente in base alla finestra Tauri corrente
  // - Finestra 'login' → sempre Login
  // - Qualsiasi altra finestra → sempre Dashboard
  return (
    <ErrorBoundary>
      <div className="animate-fade-in">
        {windowLabel === 'login' ? <Login /> : <NewDashboard />}
      </div>
    </ErrorBoundary>
  );
}

export default App;
