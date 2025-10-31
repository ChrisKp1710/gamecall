import { useAuth } from './contexts/AuthContext';
import { Login } from './components/auth/Login';
import { NewDashboard } from './components/dashboard/NewDashboard';
import { useEffect } from 'react';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  // Previeni flash di contenuto durante caricamento
  useEffect(() => {
    // Sincronizza tema con system preference
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Mostra loader durante verifica autenticazione iniziale
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Caricamento...</p>
        </div>
      </div>
    );
  }

  // Router semplice: mostra Login o Dashboard in base allo stato di autenticazione
  return (
    <div className="animate-fade-in">
      {isAuthenticated ? <NewDashboard /> : <Login />}
    </div>
  );
}

export default App;
