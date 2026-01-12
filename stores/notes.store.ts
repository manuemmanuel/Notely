import { create } from 'zustand'
import { supabase, type Note } from '@/lib/supabase'
import { getActiveUserId } from '@/lib/auth'
import { useAuthStore } from './auth.store'

interface NotesState {
  notes: Note[]
  currentNote: Note | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchNotes: (includeDeleted?: boolean) => Promise<void>
  fetchNote: (id: string) => Promise<Note | null>
  createNote: (title?: string) => Promise<Note | null>
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  toggleFavorite: (id: string) => Promise<void>
  restoreNote: (id: string) => Promise<void>
  shareNote: (id: string) => Promise<string | null>
  unshareNote: (id: string) => Promise<void>
  setCurrentNote: (note: Note | null) => void
  updateNoteInStore: (id: string, updates: Partial<Note>) => void
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  currentNote: null,
  isLoading: false,
  error: null,

  fetchNotes: async (includeDeleted = false) => {
    set({ isLoading: true, error: null })
    try {
      const userId = getActiveUserId(useAuthStore.getState().user?.id ?? null)
      
      // Build base query
      let query = supabase
        .from('notes')
        .select('*')
        .eq('created_by', userId)
      
      // Exclude deleted notes unless explicitly requested
      if (!includeDeleted) {
        query = query.is('deleted_at', null)
      }
      
      const { data, error } = await query.order('updated_at', { ascending: false })

      if (error) {
        // If error is about missing column (migration not run), retry without the filter
        if (error.message?.includes('deleted_at') || error.message?.includes('column') || error.code === '42703') {
          console.warn('deleted_at column may not exist, fetching all notes without filter')
          const retryQuery = supabase
            .from('notes')
            .select('*')
            .eq('created_by', userId)
            .order('updated_at', { ascending: false })
          
          const { data: retryData, error: retryError } = await retryQuery
          
          if (retryError) throw retryError
          
          // Add default values for missing fields (for old notes)
          const notesWithDefaults = (retryData || []).map((note: any) => ({
            ...note,
            is_favorite: note.is_favorite ?? false,
            deleted_at: note.deleted_at ?? null,
          }))
          
          // Filter out deleted notes if not including deleted
          const filteredNotes = includeDeleted 
            ? notesWithDefaults 
            : notesWithDefaults.filter((n: any) => !n.deleted_at)
          
          set({ notes: filteredNotes, isLoading: false })
          return
        }
        throw error
      }

      // Ensure all notes have the new fields with defaults (for backward compatibility)
      const notesWithDefaults = (data || []).map((note: any) => ({
        ...note,
        is_favorite: note.is_favorite ?? false,
        deleted_at: note.deleted_at ?? null,
        share_token: note.share_token ?? null,
      }))

      set({ notes: notesWithDefaults, isLoading: false })
    } catch (error: any) {
      console.error('Error fetching notes:', error)
      set({ error: error.message, isLoading: false })
    }
  },

  fetchNote: async (id: string) => {
    set({ isLoading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      set({ currentNote: data, isLoading: false })
      return data
    } catch (error: any) {
      set({ error: error.message, isLoading: false })
      return null
    }
  },

  createNote: async (title = 'Untitled Note') => {
    try {
      const userId = getActiveUserId(useAuthStore.getState().user?.id ?? null)
      
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title,
          content: {
            type: 'doc',
            content: [
              {
                type: 'paragraph',
              },
            ],
          },
          created_by: userId,
        })
        .select()
        .single()

      if (error) throw error

      const newNote = data as Note
      set((state) => ({
        notes: [newNote, ...state.notes],
        currentNote: newNote,
      }))

      return newNote
    } catch (error: any) {
      set({ error: error.message })
      return null
    }
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Update local state
      get().updateNoteInStore(id, updates)
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  deleteNote: async (id: string) => {
    try {
      // Soft delete: set deleted_at timestamp
      const { error } = await supabase
        .from('notes')
        .update({
          deleted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Update local state
      get().updateNoteInStore(id, { deleted_at: new Date().toISOString() })
      
      // Clear current note if it was deleted
      set((state) => ({
        currentNote: state.currentNote?.id === id ? null : state.currentNote,
      }))
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  toggleFavorite: async (id: string) => {
    try {
      const note = get().notes.find((n) => n.id === id) || get().currentNote
      if (!note) return

      const newFavoriteState = !note.is_favorite
      
      const { error } = await supabase
        .from('notes')
        .update({
          is_favorite: newFavoriteState,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Update local state
      get().updateNoteInStore(id, { is_favorite: newFavoriteState })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  restoreNote: async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          deleted_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Update local state
      get().updateNoteInStore(id, { deleted_at: null })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  shareNote: async (id: string) => {
    try {
      // Generate a new UUID for the share token
      const shareToken = crypto.randomUUID()

      const { error } = await supabase
        .from('notes')
        .update({
          share_token: shareToken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Update local state
      get().updateNoteInStore(id, { share_token: shareToken })
      
      return shareToken
    } catch (error: any) {
      set({ error: error.message })
      return null
    }
  },

  unshareNote: async (id: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({
          share_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)

      if (error) throw error

      // Update local state
      get().updateNoteInStore(id, { share_token: null })
    } catch (error: any) {
      set({ error: error.message })
    }
  },

  setCurrentNote: (note: Note | null) => {
    set({ currentNote: note })
  },

  updateNoteInStore: (id: string, updates: Partial<Note>) => {
    set((state) => ({
      notes: state.notes.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      ),
      currentNote:
        state.currentNote?.id === id
          ? { ...state.currentNote, ...updates }
          : state.currentNote,
    }))
  },
}))

