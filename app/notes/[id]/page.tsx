'use client'

import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useNotesStore } from '@/stores/notes.store'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { FloatingToolbar } from '@/components/editor/FloatingToolbar'
import { EditorTitle } from '@/components/editor/EditorTitle'
import { StatusBar } from '@/components/StatusBar'
import { VersionHistory } from '@/components/version-history/VersionHistory'
import { AuthButton } from '@/components/auth/AuthButton'
import { PresenceIndicator } from '@/components/collaboration/PresenceIndicator'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { ShareButton } from '@/components/sharing/ShareButton'
import { useEditorStore } from '@/stores/editor.store'
import { useRealtimeStore } from '@/stores/realtime.store'
import { subscribeToNoteUpdates, unsubscribeFromNoteUpdates } from '@/lib/realtime'
import { saveVersionIfNeeded } from '@/lib/versions'
import { Button, Spinner } from '@heroui/react'
import { useCallback, useRef, useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { saveVersionManually } from '@/lib/versions'
import { supabase } from '@/lib/supabase'

export default function NoteDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const noteId = params.id as string
  const shareToken = searchParams.get('share')

  const { currentNote, fetchNote, updateNote, updateNoteInStore, setCurrentNote } = useNotesStore()
  const { setHasUnsavedChanges, setSaving, setLastSaved, setRemoteUpdate } = useEditorStore()
  const { setActiveChannel, clearActiveUsers } = useRealtimeStore()
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const DEBOUNCE_MS = 400

  // Manual save function (for Ctrl+S)
  const handleManualSave = useCallback(async () => {
    if (!currentNote) return

    // Get editor from store
    const editorState = useEditorStore.getState()
    if (!editorState.editor) return

    const content = editorState.editor.getJSON()
    
    setSaving(true)
    try {
      await updateNote(currentNote.id, { content })
      // Create a manual version snapshot
      await saveVersionManually(currentNote.id, content)
      setHasUnsavedChanges(false)
      setLastSaved(new Date())
    } catch (error) {
      console.error('Error saving note:', error)
    } finally {
      setSaving(false)
    }
  }, [currentNote, updateNote, setSaving, setHasUnsavedChanges, setLastSaved])

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleManualSave()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleManualSave])

  // Fetch note on mount
  useEffect(() => {
    const loadNote = async () => {
      setIsLoading(true)
      // If there's a share token, fetch the note by share_token instead
      if (shareToken) {
        try {
          const { data, error } = await supabase
            .from('notes')
            .select('*')
            .eq('share_token', shareToken)
            .single()
          
          if (error) throw error
          
          if (data) {
            setCurrentNote(data)
          }
        } catch (error: any) {
          console.error('Error loading shared note:', error)
        }
      } else {
        await fetchNote(noteId)
      }
      setIsLoading(false)
    }
    if (noteId) {
      loadNote()
    }
  }, [noteId, shareToken, fetchNote, setCurrentNote])

  // Memoized title update handler to prevent unnecessary re-renders
  const handleTitleUpdate = useCallback(
    (newTitle: string) => {
      if (currentNote) {
        updateNote(currentNote.id, { title: newTitle })
      }
    },
    [currentNote?.id, updateNote]
  )

  // Handle editor content updates with debouncing
  const handleContentUpdate = useCallback(
    (content: any) => {
      if (!currentNote) return

      setHasUnsavedChanges(true)

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }

      // Set new timeout for autosave
      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true)
        try {
          await updateNote(currentNote.id, { content })
          // Save version history if needed
          await saveVersionIfNeeded(currentNote.id, content)
          setHasUnsavedChanges(false)
          setLastSaved(new Date())
        } catch (error) {
          console.error('Error saving note:', error)
        } finally {
          setSaving(false)
        }
      }, DEBOUNCE_MS)
    },
    [currentNote, updateNote, setHasUnsavedChanges, setSaving, setLastSaved]
  )

  // Set up real-time subscription
  useEffect(() => {
    if (!currentNote || currentNote.id !== noteId) {
      return
    }

    // Subscribe to real-time updates
    const channel = subscribeToNoteUpdates(noteId, (payload) => {
      const remoteContent = payload.new.content
      const currentContent = currentNote.content

      // Only update if content actually changed and it's from remote
      const remoteContentStr = JSON.stringify(remoteContent)
      const currentContentStr = JSON.stringify(currentContent)

      if (remoteContentStr !== currentContentStr) {
        setRemoteUpdate(true)
        // Update the note in store (don't write to DB, it's already updated)
        updateNoteInStore(currentNote.id, { content: remoteContent })
      }
    })

    setActiveChannel(channel)

    // Cleanup on unmount or note change
    return () => {
      unsubscribeFromNoteUpdates(channel)
      setActiveChannel(null)
      clearActiveUsers()
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [noteId, currentNote, setActiveChannel, clearActiveUsers, setRemoteUpdate, updateNoteInStore])

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  if (!currentNote) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">Note not found</p>
            <Button
              size="sm"
              variant="flat"
              onPress={() => router.push('/notes')}
            >
              Go to Notes
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-50/30 dark:bg-gray-950">
      <Sidebar />
      
      {/* Editor Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/60 dark:border-gray-800/60 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="light"
              onPress={() => setIsVersionHistoryOpen(true)}
              className="text-gray-600 dark:text-gray-400 min-w-0 h-8 w-8 p-0"
              isIconOnly
              aria-label="Version History"
            >
              <Clock size={16} />
            </Button>
            <ShareButton />
          </div>
          <div className="flex items-center gap-3">
            <PresenceIndicator />
            <ThemeToggle />
            <AuthButton />
          </div>
        </div>

        {/* Editor Container - Centered with max width */}
        <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950/50">
          <div className="max-w-3xl mx-auto px-6 py-8 relative">
            {/* Floating Toolbar */}
            <FloatingToolbar />

            {/* Title */}
            <EditorTitle
              noteId={currentNote.id}
              title={currentNote.title || ''}
              onChange={handleTitleUpdate}
            />

            {/* Editor Content - Document Surface */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 p-12 min-h-[600px] relative">
              <TipTapEditor
                noteId={currentNote.id}
                initialContent={currentNote.content}
                onUpdate={handleContentUpdate}
              />
              
              {/* Status Bar - Bottom Right */}
              <StatusBar />
            </div>
          </div>
        </div>
      </div>

      <VersionHistory
        noteId={currentNote.id}
        isOpen={isVersionHistoryOpen}
        onClose={() => setIsVersionHistoryOpen(false)}
      />
    </div>
  )
}
