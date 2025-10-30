import { Contact } from '../../types';

interface ContactCardProps {
  contact: Contact;
  onCall: (contactId: string) => void;
}

export function ContactCard({ contact, onCall }: ContactCardProps) {
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    'in-call': 'bg-yellow-500',
    busy: 'bg-red-500',
  };

  const statusText = {
    online: 'Online',
    offline: 'Offline',
    'in-call': 'In chiamata',
    busy: 'Occupato',
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-lg rounded-xl p-4 border border-gray-700 hover:border-purple-500/50 transition-all group">
      <div className="flex items-center gap-4">
        {/* Avatar con status indicator */}
        <div className="relative">
          <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-gray-700 group-hover:ring-purple-500 transition-all">
            {contact.avatar ? (
              <img src={contact.avatar} alt={contact.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xl">
                {contact.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {/* Status dot */}
          <div className={`absolute bottom-0 right-0 w-4 h-4 ${statusColors[contact.status]} rounded-full border-2 border-gray-900`} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white truncate">{contact.username}</h3>
            {contact.isFavorite && (
              <svg className="w-4 h-4 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            )}
          </div>
          <p className="text-sm text-gray-400">{statusText[contact.status]}</p>
        </div>

        {/* Call buttons */}
        <div className="flex gap-2">
          {contact.status === 'online' ? (
            <>
              {/* Audio call */}
              <button
                onClick={() => onCall(contact.id)}
                className="p-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors group/btn"
                title="Chiamata audio"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>

              {/* Video call */}
              <button
                onClick={() => onCall(contact.id)}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors group/btn"
                title="Videochiamata"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </>
          ) : (
            <div className="px-4 py-2 bg-gray-700 rounded-lg text-gray-400 text-sm">
              Non disponibile
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
