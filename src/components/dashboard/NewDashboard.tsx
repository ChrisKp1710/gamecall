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
import { ChatNotificationToast } from '../notifications/ChatNotificationToast';
import { VideoCall } from '../call/VideoCall';
import { SimpleIncomingCallModal } from '../call/SimpleIncomingCallModal';

interface ChatNotification {
  fromUserId: string;
  fromUsername: string;
  fromAvatar?: string;
}

interface IncomingCall {
  fromUser: Contact;
  isVideo: boolean;
}

export function NewDashboard() {
  const { user, logout } = useAuth();
  const { friends, loadFriends, removeFriend, updateFriendStatus } = useFriends();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [chatNotification, setChatNotification] = useState<ChatNotification | null>(null);

  // Stato chiamate
  const [activeCall, setActiveCall] = useState<{ contact: Contact; isVideo: boolean } | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);

  // Ref per webrtc (per evitare dipendenze circolari)
  const webrtcRef = useRef<ReturnType<typeof useWebRTC> | null>(null);

  // Richiedi permesso notifiche all'avvio
  useEffect(() => {
    const checkNotificationPermission = async () => {
      try {
        let permissionGranted = await isPermissionGranted();
        if (!permissionGranted) {
          const permission = await requestPermission();
          permissionGranted = permission === 'granted';
        }
      } catch (error) {
        // Ignora errore permessi (può capitare in dev o se non configurato)
      }
    };
    checkNotificationPermission();
  }, []);

  // WebSocket per aggiornamenti real-time (UNICA istanza per tutta l'app!)
  const { sendMessage: sendWsMessage } = useWebSocket({
    onFriendAdded: () => {
      loadFriends();
    },
    onFriendRemoved: (friendId) => {
      loadFriends();
      // Se chat aperta con amico rimosso, chiudi chat
      if (selectedContact?.id === friendId) {
        setSelectedContact(null);
      }
    },
    onUserOnline: (userId) => {
      updateFriendStatus(userId, 'online');
    },
    onUserOffline: (userId) => {
      updateFriendStatus(userId, 'offline');
    },
    onUserAway: (userId) => {
      updateFriendStatus(userId, 'away');
    },
    onUserEnteredChat: (userId) => {
      updateFriendStatus(userId, 'in_chat');
    },
    onUserLeftChat: (userId) => {
      updateFriendStatus(userId, 'online');
    },
    onChatNotificationRequest: async (fromUserId, fromUsername) => {
      // Trova avatar dell'amico
      const friend = friends.find(f => f.id === fromUserId);

      // Controlla se sei già in chat con questa persona
      const isAlreadyInChatWithSender = selectedContact?.id === fromUserId;

      if (isAlreadyInChatWithSender) {
        return; // Non mostrare nulla se sei già in chat con loro
      }

      // Mostra notifica desktop (Tauri si occupa di mostrarla solo se app in background)
      try {
        await sendNotification({
          title: 'GameCall',
          body: `${fromUsername} vuole chattare con te!`,
        });
      } catch (error) {
        // Ignora errori notifica
      }

      // Mostra toast in-app
      setChatNotification({
        fromUserId,
        fromUsername,
        fromAvatar: friend?.avatar,
      });
    },
    onWebRTCSignal: useCallback(async (fromUserId: string, signal: any) => {
      if (webrtcRef.current) {
        await webrtcRef.current.handleSignal(fromUserId, signal);
      }
    }, []),
  });

  // Gestione lifecycle app (focus/blur)
  useAppLifecycle({ sendWsMessage });

  // Sincronizza selectedContact quando cambia lo stato nell'array friends
  useEffect(() => {
    if (selectedContact) {
      const updatedContact = friends.find(f => f.id === selectedContact.id);
      if (updatedContact && updatedContact.status !== selectedContact.status) {
        setSelectedContact(updatedContact);
      }
    }
  }, [friends, selectedContact]);

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

  // Gestione chiamate
  const handleStartCall = useCallback((contact: Contact, isVideo: boolean) => {
    console.log(`📞 Avvio ${isVideo ? 'videochiamata' : 'chiamata audio'} con ${contact.username}`);
    setActiveCall({ contact, isVideo });
  }, []);

  const handleEndCall = useCallback(() => {
    console.log('🔴 Fine chiamata');
    setActiveCall(null);
  }, []);

  const handleAcceptCall = useCallback(() => {
    if (incomingCall) {
      console.log(`✅ Accetto chiamata da ${incomingCall.fromUser.username}`);
      setActiveCall({ contact: incomingCall.fromUser, isVideo: incomingCall.isVideo });
      setIncomingCall(null);
    }
  }, [incomingCall]);

  const handleRejectCall = useCallback(() => {
    if (incomingCall) {
      console.log(`❌ Rifiuto chiamata da ${incomingCall.fromUser.username}`);
      // TODO: Invia messaggio WebSocket per notificare il rifiuto
      setIncomingCall(null);
    }
  }, [incomingCall]);

  // Mostra VideoCall se c'è una chiamata attiva
  if (activeCall && user) {
    return (
      <VideoCall
        currentUser={{
          id: user.id,
          username: user.username,
          status: 'in_chat',
          avatar: user.avatar,
          friendCode: user.friendCode,
        }}
        targetUser={activeCall.contact}
        onEndCall={handleEndCall}
      />
    );
  }

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
          onStartCall={handleStartCall}
        />
      )}

      {/* Panel destro - Profilo (opzionale) */}
      {showProfile && (
        <ProfilePanel
          user={user}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* Toast notifica chat */}
      {chatNotification && (
        <ChatNotificationToast
          fromUsername={chatNotification.fromUsername}
          fromAvatar={chatNotification.fromAvatar}
          onOpenChat={() => {
            // Trova il contatto e aprilo
            const friend = friends.find(f => f.id === chatNotification.fromUserId);
            if (friend) {
              handleSelectContact(friend);
            }
          }}
          onClose={() => setChatNotification(null)}
        />
      )}

      {/* Modal chiamata in arrivo */}
      {incomingCall && (
        <SimpleIncomingCallModal
          caller={incomingCall.fromUser}
          isVideoCall={incomingCall.isVideo}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}
    </div>
  );
}
