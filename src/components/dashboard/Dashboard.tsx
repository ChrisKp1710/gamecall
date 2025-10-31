import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Contact } from '../../types';
import { ContactCard } from './ContactCard';
import { VideoCall } from '../call/VideoCall';
import { IncomingCallModal } from '../call/IncomingCallModal';
import { CallingScreen } from '../call/CallingScreen';
import { AddFriendModal } from './AddFriendModal';
import { useCallStore } from '../../stores/callStore';
import { useFriends } from '../../hooks/useFriends';

export function Dashboard() {
  const { user, logout } = useAuth();
  const {
    isInCall,
    isCalling,
    incomingCallData,
    startCall,
    endCall,
  } = useCallStore();
  const { friends, loadFriends } = useFriends();
  const [targetContact, setTargetContact] = useState<Contact | null>(null);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);

  // 🔥 Inizializza peer connection per ricevere chiamate in arrivo
  // NOTA: NON usare qui usePeerConnection, viene già gestito in VideoCall!
  // Questo causava doppia inizializzazione. Lo commentiamo.

  /* RIMOSSO: causa doppia inizializzazione peer
  usePeerConnection(user?.id || '', {
    onIncomingCall: (_call, fromPeerId) => {
      console.log('📞 Chiamata in arrivo da:', fromPeerId);

      const callerId = fromPeerId.replace('user-', '');
      const caller = contacts.find(c => c.id === callerId) || {
        id: callerId,
        username: 'Utente Sconosciuto',
        status: 'online' as const,
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Unknown',
      };

      setIncomingCall(caller, 'video');
    },
  });
  */

  // TODO: Implementare sistema di segnalazione centralizzato per chiamate in arrivo

  const handleCall = (contactId: string) => {
    const contact = friends.find(c => c.id === contactId);
    if (!contact) return;

    console.log(`📞 Avvio chiamata a ${contact.username}`);
    setTargetContact(contact);

    // Invia segnale chiamata → store setta isCalling=true
    startCall(contact, 'video');
  };

  const handleCancelCall = () => {
    console.log('❌ Chiamata annullata');
    setTargetContact(null);
    endCall(); // Store setta isCalling=false
  };

  // 🔥 Gestisce accettazione chiamata in arrivo
  useEffect(() => {
    // Se chiamata accettata (isInCall diventa true) e NON sto chiamando io (chiamata ricevuta)
    if (isInCall && !isCalling && incomingCallData) {
      console.log('✅ Chiamata in arrivo accettata, setto target contact');
      setTargetContact(incomingCallData.from);
    }
  }, [isInCall, isCalling, incomingCallData]);

  const handleEndCall = () => {
    console.log('📞 Chiusura chiamata');
    endCall(); // Store gestisce reset di isCalling e isInCall
    setTargetContact(null);
  };

  // 🔥 Schermata "Chiamata in corso..." (attesa risposta)
  if (isCalling && targetContact) {
    return (
      <CallingScreen
        targetUsername={targetContact.username}
        targetAvatar={targetContact.avatar}
        onCancel={handleCancelCall}
      />
    );
  }

  // Se in chiamata ACCETTATA, mostra UI chiamata
  if (isInCall && targetContact && user) {
    return (
      <VideoCall
        currentUser={{
          id: user.id,
          username: user.username,
          status: user.status,
          avatar: user.avatar,
        }}
        targetUser={targetContact}
        onEndCall={handleEndCall}
      />
    );
  }

  const onlineContacts = friends.filter(c => c.status === 'online');
  const otherContacts = friends.filter(c => c.status !== 'online');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 animate-fade-in">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            {/* Logo + User info */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">GameCall</h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Ciao, <span className="text-primary-600 dark:text-primary-400">{user?.username}</span>!
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
              {/* Settings */}
              <button
                className="p-2 sm:p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 group"
                title="Impostazioni"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white group-hover:rotate-90 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-error-600 to-error-500 hover:from-error-700 hover:to-error-600 text-white rounded-xl transition-all duration-200 text-sm sm:text-base font-semibold shadow-lg shadow-error-500/30 hover:shadow-xl hover:shadow-error-500/40 transform hover:scale-105 active:scale-95"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          {/* Contacts list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Online contacts */}
            <div>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-success-500"></span>
                  </span>
                  Online ({onlineContacts.length})
                </h2>
              </div>

              <div className="space-y-4">
                {onlineContacts.length > 0 ? (
                  onlineContacts.map((contact, index) => (
                    <div
                      key={contact.id}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <ContactCard contact={contact} onCall={handleCall} />
                    </div>
                  ))
                ) : (
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg rounded-2xl p-12 text-center border border-gray-200/50 dark:border-gray-700/50">
                    <svg className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Nessun amico online al momento</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">Torna più tardi o aggiungi nuovi contatti</p>
                  </div>
                )}
              </div>
            </div>

            {/* Other contacts */}
            {otherContacts.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Altri contatti</h2>
                <div className="space-y-4">
                  {otherContacts.map(contact => (
                    <ContactCard key={contact.id} contact={contact} onCall={handleCall} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Friend Code Card */}
            <div className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-6 text-white shadow-xl shadow-primary-500/30">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <h3 className="text-lg font-bold">Il tuo Friend Code</h3>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 mb-4">
                <p className="text-sm text-primary-100 mb-2">Condividi questo codice con i tuoi amici:</p>
                <div className="flex items-center justify-between bg-white/20 rounded-lg p-3">
                  <code className="text-2xl font-bold tracking-wider font-mono">
                    {user?.friendCode || 'Loading...'}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(user?.friendCode || '');
                      // TODO: Mostra notifica "Copiato!"
                    }}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    title="Copia"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowAddFriendModal(true)}
                className="w-full px-4 py-3 bg-white hover:bg-primary-50 text-primary-600 rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Aggiungi Amico
              </button>
            </div>

            {/* Stats card */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Statistiche
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="text-gray-700 dark:text-gray-300 font-medium">Amici totali</span>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{friends.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-success-50 dark:bg-success-900/20 rounded-xl">
                  <span className="text-success-700 dark:text-success-300 font-medium">Online</span>
                  <span className="text-2xl font-bold text-success-600 dark:text-success-400">{onlineContacts.length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-accent-50 dark:bg-accent-900/20 rounded-xl">
                  <span className="text-accent-700 dark:text-accent-300 font-medium">Chiamate oggi</span>
                  <span className="text-2xl font-bold text-accent-600 dark:text-accent-400">0</span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 rounded-2xl p-6 text-white shadow-xl shadow-primary-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🚀</span>
                <h3 className="text-xl font-bold">In arrivo...</h3>
              </div>
              <p className="text-sm text-primary-100 mb-5 leading-relaxed">
                Funzionalità avanzate in sviluppo per migliorare la tua esperienza!
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Videochiamate HD 1080p</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Condivisione schermo gaming</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Chat crittografata E2E</span>
                </div>
                <div className="flex items-center gap-3 p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="font-medium">Picture-in-Picture overlay</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal chiamata in arrivo */}
      <IncomingCallModal />

      {/* Modal aggiungi amico */}
      <AddFriendModal
        isOpen={showAddFriendModal}
        onClose={() => setShowAddFriendModal(false)}
        onFriendAdded={loadFriends}
      />
    </div>
  );
}
