import { useState, useEffect } from 'react';
import { Contact } from '../types';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../contexts/AuthContext';

export function useFriends() {
  const { token } = useAuth();
  const [friends, setFriends] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carica lista amici dall'API
  const loadFriends = async () => {
    if (!token) {
      setFriends([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.friends, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore nel caricamento degli amici');
      }

      const data = await response.json();

      // Il backend restituisce array di: { id, username, friend_code, avatar_url, status }
      const friendsList: Contact[] = data.map((friend: any) => ({
        id: friend.id,
        username: friend.username,
        status: friend.status || 'offline',
        avatar: friend.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.username}`,
        friendCode: friend.friend_code,
      }));

      setFriends(friendsList);
    } catch (err) {
      console.error('Errore caricamento amici:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Aggiungi amico tramite Friend Code
  const addFriend = async (friendCode: string): Promise<boolean> => {
    if (!token) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.addFriend, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ friend_code: friendCode }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Errore nell\'aggiunta dell\'amico');
      }

      // Ricarica lista amici
      await loadFriends();
      return true;
    } catch (err) {
      console.error('Errore aggiunta amico:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Rimuovi amico
  const removeFriend = async (friendId: string): Promise<boolean> => {
    if (!token) return false;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.removeFriend(friendId), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Errore nella rimozione dell\'amico');
      }

      // Ricarica lista amici
      await loadFriends();
      return true;
    } catch (err) {
      console.error('Errore rimozione amico:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Carica amici all'avvio
  useEffect(() => {
    if (token) {
      loadFriends();
    }
  }, [token]);

  return {
    friends,
    isLoading,
    error,
    loadFriends,
    addFriend,
    removeFriend,
  };
}
