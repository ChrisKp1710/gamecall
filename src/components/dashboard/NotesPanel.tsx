import { useState } from 'react';
import { useNotes, Note } from '../../hooks/useNotes';

export function NotesPanel() {
  const { notes, isLoading, createNote, updateNote, deleteNote, searchNotes } = useNotes();
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const displayedNotes = searchQuery ? searchNotes(searchQuery) : notes;

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedNote(null);
    setEditTitle('');
    setEditContent('');
  };

  const handleSaveNew = async () => {
    if (!editTitle.trim()) {
      alert('Il titolo è obbligatorio!');
      return;
    }
    await createNote(editTitle.trim(), editContent.trim());
    setIsCreating(false);
    setEditTitle('');
    setEditContent('');
  };

  const handleSelectNote = (note: Note) => {
    setSelectedNote(note);
    setIsCreating(false);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleUpdateNote = async () => {
    if (!selectedNote) return;
    if (!editTitle.trim()) {
      alert('Il titolo è obbligatorio!');
      return;
    }
    await updateNote(selectedNote.id, {
      title: editTitle.trim(),
      content: editContent.trim(),
    });
    setSelectedNote(null);
  };

  const handleDeleteNote = async (id: string) => {
    if (confirm('Sei sicuro di voler eliminare questa nota?')) {
      await deleteNote(id);
      if (selectedNote?.id === id) {
        setSelectedNote(null);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setSelectedNote(null);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500">Caricamento note...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex bg-gray-50 dark:bg-gray-900">
      {/* Lista note - Sidebar sinistra */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Le Mie Note</h2>
            <button
              onClick={handleCreateNew}
              className="p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
              title="Nuova nota"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* Barra ricerca */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cerca note..."
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Lista note */}
        <div className="flex-1 overflow-y-auto">
          {displayedNotes.length === 0 ? (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              {searchQuery ? 'Nessuna nota trovata' : 'Nessuna nota ancora'}
            </div>
          ) : (
            displayedNotes.map((note) => (
              <div
                key={note.id}
                onClick={() => handleSelectNote(note)}
                className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  selectedNote?.id === note.id ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-l-primary-500' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">{note.title}</h3>
                    {note.content && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 truncate mt-1">{note.content}</p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {note.updatedAt.toLocaleDateString('it-IT')} {note.updatedAt.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNote(note.id);
                    }}
                    className="p-1 hover:bg-error-50 dark:hover:bg-error-900/20 rounded transition-colors"
                    title="Elimina"
                  >
                    <svg className="w-4 h-4 text-error-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Area editor - Destra */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        {!selectedNote && !isCreating ? (
          // Stato vuoto
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <svg className="w-32 h-32 text-gray-300 dark:text-gray-700 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Le tue note personali</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Prendi appunti durante le sessioni di gaming!</p>
            <button
              onClick={handleCreateNew}
              className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              Crea la prima nota
            </button>
          </div>
        ) : (
          // Editor nota
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {isCreating ? 'Nuova nota' : 'Modifica nota'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={isCreating ? handleSaveNew : handleUpdateNote}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                >
                  Salva
                </button>
              </div>
            </div>

            {/* Form editor */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Titolo nota..."
                className="text-3xl font-bold bg-transparent border-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none mb-4"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Scrivi qui i tuoi appunti..."
                className="flex-1 bg-transparent border-0 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
