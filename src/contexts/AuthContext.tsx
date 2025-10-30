import { createContext, useContext, useState, ReactNode } from 'react';
import { User, AuthState } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => {
    // Recupera dati da localStorage se presenti
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    return {
      user: savedUser ? JSON.parse(savedUser) : null,
      token: savedToken,
      isAuthenticated: !!savedToken,
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login mock
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (password.length < 3) {
        throw new Error('Password troppo corta');
      }

      const user: User = {
        id: `user-${Date.now()}`,
        username,
        status: 'online',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      };

      const token = `mock-token-${Date.now()}`;

      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      setAuthState({
        user,
        token,
        isAuthenticated: true,
      });

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore login');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Registrazione mock
  const register = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      if (username.length < 3) {
        throw new Error('Username troppo corto (min 3 caratteri)');
      }

      if (password.length < 6) {
        throw new Error('Password troppo corta (min 6 caratteri)');
      }

      return await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore registrazione');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user: authState.user,
        token: authState.token,
        isAuthenticated: authState.isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook personalizzato per usare il context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve essere usato dentro AuthProvider');
  }
  return context;
}
