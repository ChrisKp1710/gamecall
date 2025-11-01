import { useState, useEffect, useCallback } from 'react';
import { BaseDirectory, exists, readTextFile, writeTextFile, mkdir } from '@tauri-apps/plugin-fs';
import { useAuth } from '../contexts/AuthContext';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Helper per convertire stringhe in Date
function parseNote(note: any): Note {
  return {
    ...note,
    createdAt: new Date(note.createdAt),
    updatedAt: new Date(note.updatedAt),
  };
}

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Genera path dinamico basato sul Friend Code dell'utente
  const getUserNotesPath = useCallback(() => {
    if (!user?.friendCode) return null;
    // Sanitize friend code per usarlo come nome cartella (rimuovi caratteri speciali se necessario)
    const safeFriendCode = user.friendCode.replace(/[^a-zA-Z0-9-]/g, '_');
    return `notes_${safeFriendCode}/notes.json`;
  }, [user?.friendCode]);

  const getStorageKey = useCallback(() => {
    if (!user?.friendCode) return 'gamecall_notes';
    return `gamecall_notes_${user.friendCode}`;
  }, [user?.friendCode]);

  // Carica note da file Tauri (con fallback a localStorage)
  useEffect(() => {
    const loadNotes = async () => {
      const filePath = getUserNotesPath();
      const storageKey = getStorageKey();

      if (!filePath || !user) {
        setIsLoading(false);
        return;
      }

      try {
        // Prova a caricare da file Tauri
        const fileExists = await exists(filePath, { baseDir: BaseDirectory.AppData });

        if (fileExists) {
          const content = await readTextFile(filePath, { baseDir: BaseDirectory.AppData });
          const parsed = JSON.parse(content);
          const notesWithDates = parsed.map(parseNote);
          setNotes(notesWithDates);
          console.log('✅ Note caricate da file:', filePath);
        } else {
          // Fallback: carica da localStorage (per retrocompatibilità)
          const stored = localStorage.getItem(storageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            const notesWithDates = parsed.map(parseNote);
            setNotes(notesWithDates);

            // Crea cartella utente se non esiste
            const folderPath = filePath.split('/')[0];
            try {
              await mkdir(folderPath, { baseDir: BaseDirectory.AppData, recursive: true });
            } catch (e) {
              // Cartella potrebbe già esistere, ignora errore
            }

            // Salva subito su file per migrazione
            await writeTextFile(filePath, JSON.stringify(parsed), { baseDir: BaseDirectory.AppData });
            console.log('✅ Note migrate da localStorage a file:', filePath);
          } else {
            // Nessuna nota esistente, crea cartella comunque
            const folderPath = filePath.split('/')[0];
            try {
              await mkdir(folderPath, { baseDir: BaseDirectory.AppData, recursive: true });
              console.log('✅ Cartella note creata:', folderPath);
            } catch (e) {
              // Ignora errore se cartella esiste già
            }
          }
        }
      } catch (error) {
        console.error('❌ Errore caricamento note:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [user, getUserNotesPath, getStorageKey]);

  // Salva note su file (e localStorage come backup)
  const saveNotes = useCallback(async (newNotes: Note[]) => {
    const filePath = getUserNotesPath();
    const storageKey = getStorageKey();

    if (!filePath) {
      console.warn('⚠️ Impossibile salvare note: utente non loggato');
      return;
    }

    try {
      const json = JSON.stringify(newNotes, null, 2);

      // Assicurati che la cartella esista
      const folderPath = filePath.split('/')[0];
      try {
        await mkdir(folderPath, { baseDir: BaseDirectory.AppData, recursive: true });
      } catch (e) {
        // Ignora se già esiste
      }

      // Salva su file Tauri
      await writeTextFile(filePath, json, { baseDir: BaseDirectory.AppData });
      console.log('✅ Note salvate su file:', filePath);

      // Backup su localStorage
      localStorage.setItem(storageKey, json);

      setNotes(newNotes);
    } catch (error) {
      console.error('❌ Errore salvataggio note:', error);
      // Fallback: salva almeno su localStorage
      try {
        localStorage.setItem(storageKey, JSON.stringify(newNotes));
        setNotes(newNotes);
      } catch (e) {
        console.error('❌ Errore fallback localStorage:', e);
      }
    }
  }, [getUserNotesPath, getStorageKey]);

  // Crea nuova nota
  const createNote = useCallback(async (title: string, content: string = '') => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedNotes = [newNote, ...notes];
    await saveNotes(updatedNotes);
    return newNote;
  }, [notes, saveNotes]);

  // Aggiorna nota esistente
  const updateNote = useCallback(async (id: string, updates: Partial<Pick<Note, 'title' | 'content'>>) => {
    const updatedNotes = notes.map(note =>
      note.id === id
        ? { ...note, ...updates, updatedAt: new Date() }
        : note
    );
    await saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  // Elimina nota
  const deleteNote = useCallback(async (id: string) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    await saveNotes(updatedNotes);
  }, [notes, saveNotes]);

  // Cerca note
  const searchNotes = useCallback((query: string): Note[] => {
    if (!query.trim()) return notes;

    const lowerQuery = query.toLowerCase();
    return notes.filter(note =>
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery)
    );
  }, [notes]);

  return {
    notes,
    isLoading,
    createNote,
    updateNote,
    deleteNote,
    searchNotes,
  };
}
