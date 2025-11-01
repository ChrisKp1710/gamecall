import { useState, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useFriends } from '../../hooks/useFriends';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useWebRTC } from '../../hooks/useWebRTC';
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

  // Ref per webrtc (per evitare dipendenze circolari)
  const webrtcRef = useRef<ReturnType<typeof useWebRTC> | null>(null);

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
    onWebRTCSignal: useCallback(async (fromUserId: string, signal: any) => {
      if (webrtcRef.current) {
        await webrtcRef.current.handleSignal(fromUserId, signal);
      }
    }, []),
  });

  const handleSelectContact = useCallback((contact: Contact) => {
    setSelectedContact(contact);
    setShowProfile(false);
    setShowNotes(false);
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
