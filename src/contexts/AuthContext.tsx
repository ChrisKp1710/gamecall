import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState } from '../types';
import { API_ENDPOINTS } from '../config/api';

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

  // Sincronizza localStorage tra tab
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        // Se token o user cambiano in altra tab, aggiorna stato
        const newUser = localStorage.getItem('user');
        const newToken = localStorage.getItem('token');

        setAuthState({
          user: newUser ? JSON.parse(newUser) : null,
          token: newToken,
          isAuthenticated: !!newToken,
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Login con API reale
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Errore durante il login');
      }

      const data = await response.json();

      // Il backend restituisce: { token: string, user: { id, username, friend_code, avatar_url, status } }
      const user: User = {
        id: data.user.id,
        username: data.user.username,
        status: data.user.status || 'online',
        avatar: data.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.username}`,
        friendCode: data.user.friend_code,
      };

      const token = data.token;

      // Salva in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      setAuthState({
        user,
        token,
        isAuthenticated: true,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore login';
      setError(errorMessage);
      console.error('Login error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Registrazione con API reale
  const register = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validazione locale username
      if (username.length < 3) {
        throw new Error('Username troppo corto (min 3 caratteri)');
      }

      if (username.length > 20) {
        throw new Error('Username troppo lungo (max 20 caratteri)');
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        throw new Error('Username può contenere solo lettere, numeri e underscore');
      }

      // Validazione password sicura
      if (password.length < 8) {
        throw new Error('Password troppo corta (min 8 caratteri)');
      }

      if (password.length > 128) {
        throw new Error('Password troppo lunga (max 128 caratteri)');
      }

      // Password deve contenere almeno una lettera e un numero
      if (!/[a-zA-Z]/.test(password)) {
        throw new Error('Password deve contenere almeno una lettera');
      }

      if (!/[0-9]/.test(password)) {
        throw new Error('Password deve contenere almeno un numero');
      }

      // Opzionale: controlla password comuni
      const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123'];
      if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
        throw new Error('Password troppo comune, scegline una più sicura');
      }

      const response = await fetch(API_ENDPOINTS.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || 'Errore durante la registrazione');
      }

      const data = await response.json();

      // Il backend restituisce: { token: string, user: { id, username, friend_code, avatar_url, status } }
      const user: User = {
        id: data.user.id,
        username: data.user.username,
        status: data.user.status || 'online',
        avatar: data.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.username}`,
        friendCode: data.user.friend_code,
      };

      const token = data.token;

      // Salva in localStorage
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', token);

      setAuthState({
        user,
        token,
        isAuthenticated: true,
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore registrazione';
      setError(errorMessage);
      console.error('Registration error:', err);
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
