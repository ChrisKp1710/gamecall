import { useAuth } from './hooks/useAuth';
import { Login } from './components/auth/Login';
import { Dashboard } from './components/dashboard/Dashboard';

function App() {
  const { isAuthenticated } = useAuth();

  // Router semplice: mostra Login o Dashboard in base allo stato di autenticazione
  return (
    <>
      {isAuthenticated ? <Dashboard /> : <Login />}
    </>
  );
}

export default App;
