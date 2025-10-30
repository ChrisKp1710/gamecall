import { useState } from 'react';
import { User, AuthState } from '../types';

// Hook per gestire autenticazione (mock per ora, dopo useremo API reale)
export function useAuth() {
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

  // Login mock (dopo sarà chiamata API)
  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Simula chiamata API
      await new Promise(resolve => setTimeout(resolve, 500));

      // Verifica credenziali mock
      if (password.length < 3) {
        throw new Error('Password troppo corta');
      }

      // Crea utente mock
      const user: User = {
        id: `user-${Date.now()}`,
        username,
        status: 'online',
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      };

      const token = `mock-token-${Date.now()}`;

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

      // Dopo la registrazione, fai login automatico
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

  return {
    user: authState.user,
    token: authState.token,
    isAuthenticated: authState.isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
  };
}
