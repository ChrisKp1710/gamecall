import { useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFriends } from '../../hooks/useFriends';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useWebRTC } from '../../hooks/useWebRTC';
import { useAppLifecycle } from '../../hooks/useAppLifecycle';
import { sendNotification, isPermissionGranted, requestPermission } from '@tauri-apps/plugin-notification';
import { Contact } from '../../types';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { ProfilePanel } from './ProfilePanel';
import { NotesPanel } from './NotesPanel';

export function NewDashboard() {
  const { user, logout } = useAuth();
  const { friends, loadFriends, removeFriend } = useFriends();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [contactInChatWithMe, setContactInChatWithMe] = useState(false);

  // Ref per webrtc (per evitare dipendenze circolari)
  const webrtcRef = useRef<ReturnType<typeof useWebRTC> | null>(null);

  // Richiedi permesso notifiche all'avvio
  useEffect(() => {
    const checkNotificationPermission = async () => {
      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
      }
      if (permissionGranted) {
        console.log('✅ [Notifications] Permesso concesso');
      } else {
        console.warn('⚠️ [Notifications] Permesso negato');
      }
    };
    checkNotificationPermission();
  }, []);

  // WebSocket per aggiornamenti real-time (UNICA istanza per tutta l'app!)
  const { sendMessage: sendWsMessage } = useWebSocket({
    onFriendAdded: (_friendId, friendUsername, _friendCode) => {
      console.log('✅ [WebSocket] Nuovo amico aggiunto:', friendUsername);
      loadFriends();
    },
    onFriendRemoved: (friendId) => {
      console.log('❌ [WebSocket] Amico rimosso:', friendId);
      loadFriends();
      // Se chat aperta con amico rimosso, chiudi chat
      if (selectedContact?.id === friendId) {
        setSelectedContact(null);
      }
    },
    onUserOnline: (userId) => {
      console.log('🟢 [WebSocket] Utente online:', userId);
      loadFriends();
    },
    onUserOffline: (userId) => {
      console.log('🔴 [WebSocket] Utente offline:', userId);
      loadFriends();
    },
    onUserAway: (userId) => {
      console.log('😴 [WebSocket] Utente away:', userId);
      loadFriends();
    },
    onUserEnteredChat: (userId, chatWithUserId) => {
      console.log('💬 [WebSocket] Utente entrato in chat:', userId);
      loadFriends();
      // Se l'utente è entrato in chat con me
      if (user && chatWithUserId === user.id && selectedContact?.id === userId) {
        setContactInChatWithMe(true);
      }
    },
    onUserLeftChat: (userId, chatWithUserId) => {
      console.log('🚪 [WebSocket] Utente uscito dalla chat:', userId);
      loadFriends();
      // Se l'utente è uscito dalla chat con me
      if (user && chatWithUserId === user.id && selectedContact?.id === userId) {
        setContactInChatWithMe(false);
      }
    },
    onChatNotificationRequest: async (fromUserId, fromUsername) => {
      console.log('🔔 [WebSocket] Richiesta notifica da:', fromUsername);

      // Mostra notifica desktop
      try {
        await sendNotification({
          title: 'GameCall',
          body: `${fromUsername} vuole scriverti!`,
        });
      } catch (error) {
        console.error('❌ [Notifications] Errore invio notifica:', error);
      }

      // Mostra anche alert in-app (fallback)
      alert(`${fromUsername} vuole scriverti! Apri la chat per rispondere.`);
    },
    onWebRTCSignal: useCallback(async (fromUserId: string, signal: any) => {
      if (webrtcRef.current) {
        await webrtcRef.current.handleSignal(fromUserId, signal);
      }
    }, []),
  });

  // Gestione lifecycle app (focus/blur)
  useAppLifecycle({ sendWsMessage });

  const handleSelectContact = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    setShowProfile(false);
    setShowNotes(false);
    setContactInChatWithMe(false); // Reset quando cambi contatto
  }, []);

  const handleRemoveFriend = useCallback(async (friendId: string) => {
    await removeFriend(friendId);
    if (selectedContact?.id === friendId) {
      setSelectedContact(null);
    }
  }, [removeFriend, selectedContact]);

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar sinistra - Lista amici */}
      <Sidebar
        user={user}
        friends={friends}
        selectedContact={selectedContact}
        onSelectContact={handleSelectContact}
        onShowProfile={() => {
          setShowProfile(true);
          setShowNotes(false);
          setSelectedContact(null);
        }}
        onShowNotes={() => {
          setShowNotes(true);
          setShowProfile(false);
          setSelectedContact(null);
        }}
        onLogout={logout}
      />

      {/* Area centrale - Mostra Chat o Note */}
      {showNotes ? (
        <NotesPanel />
      ) : (
        <ChatArea
          selectedContact={selectedContact}
          onRemoveFriend={handleRemoveFriend}
          sendWsMessage={sendWsMessage}
          webrtcRef={webrtcRef}
          isContactInChatWithMe={contactInChatWithMe}
        />
      )}

      {/* Panel destro - Profilo (opzionale) */}
      {showProfile && (
        <ProfilePanel
          user={user}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
