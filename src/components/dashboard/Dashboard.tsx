import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Contact } from '../../types';
import { ContactCard } from './ContactCard';

export function Dashboard() {
  const { user, logout } = useAuth();

  // Contatti mock per demo
  const [contacts] = useState<Contact[]>([
    {
      id: '1',
      username: 'Marco_Gaming',
      status: 'online',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco',
      isFavorite: true,
    },
    {
      id: '2',
      username: 'LucaStreamer',
      status: 'in-call',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luca',
    },
    {
      id: '3',
      username: 'GiuliaGamer',
      status: 'online',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Giulia',
      isFavorite: true,
    },
    {
      id: '4',
      username: 'AlessioProPlayer',
      status: 'busy',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alessio',
    },
    {
      id: '5',
      username: 'ChiaraTV',
      status: 'offline',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chiara',
    },
  ]);

  const handleCall = (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    alert(`📞 Chiamata a ${contact?.username} (coming soon!)`);
    // TODO: Implementare chiamata WebRTC
  };

  const onlineContacts = contacts.filter(c => c.status === 'online');
  const otherContacts = contacts.filter(c => c.status !== 'online');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/50 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo + User info */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              
              <div>
                <h1 className="text-xl font-bold text-white">GameCall</h1>
                <p className="text-sm text-gray-400">Ciao, {user?.username}!</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Settings */}
              <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors" title="Impostazioni">
                <svg className="w-6 h-6 text-gray-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contacts list */}
          <div className="lg:col-span-2 space-y-6">
            {/* Online contacts */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  Online ({onlineContacts.length})
                </h2>
              </div>
              
              <div className="space-y-3">
                {onlineContacts.length > 0 ? (
                  onlineContacts.map(contact => (
                    <ContactCard key={contact.id} contact={contact} onCall={handleCall} />
                  ))
                ) : (
                  <div className="bg-gray-800/30 rounded-xl p-8 text-center">
                    <p className="text-gray-400">Nessun amico online al momento</p>
                  </div>
                )}
              </div>
            </div>

            {/* Other contacts */}
            {otherContacts.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Altri contatti</h2>
                <div className="space-y-3">
                  {otherContacts.map(contact => (
                    <ContactCard key={contact.id} contact={contact} onCall={handleCall} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats card */}
            <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-4">Statistiche</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Amici totali</span>
                  <span className="text-white font-bold">{contacts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Online</span>
                  <span className="text-green-400 font-bold">{onlineContacts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Chiamate oggi</span>
                  <span className="text-purple-400 font-bold">0</span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">🚀 Coming Soon</h3>
              <p className="text-sm text-purple-100 mb-4">
                Presto potrai effettuare videochiamate, condividere lo schermo e chattare con i tuoi amici!
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Videochiamate HD</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Condivisione schermo</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Chat crittografata</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Picture-in-Picture</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
