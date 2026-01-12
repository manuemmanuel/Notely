'use client'

import { Sidebar } from '@/components/sidebar/Sidebar'
import { TipTapEditor } from '@/components/editor/TipTapEditor'
import { FloatingToolbar } from '@/components/editor/FloatingToolbar'
import { EditorTitle } from '@/components/editor/EditorTitle'
import { StatusBar } from '@/components/StatusBar'
import { VersionHistory } from '@/components/version-history/VersionHistory'
import { AuthButton } from '@/components/auth/AuthButton'
import { PresenceIndicator } from '@/components/collaboration/PresenceIndicator'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useNotesStore } from '@/stores/notes.store'
import { useEditorStore } from '@/stores/editor.store'
import { useRealtimeStore } from '@/stores/realtime.store'
import { useEffect, useCallback, useRef, useState } from 'react'
import { subscribeToNoteUpdates, unsubscribeFromNoteUpdates } from '@/lib/realtime'
import { saveVersionIfNeeded } from '@/lib/versions'
import { Button } from '@heroui/react'
import { useRouter } from 'next/navigation'
import { Clock } from 'lucide-react'
import { saveVersionManually } from '@/lib/versions'

export default function NotesPage() {
  const { currentNote, updateNote, fetchNote, updateNoteInStore } = useNotesStore()
  const { setHasUnsavedChanges, setSaving, setLastSaved, setRemoteUpdate } = useEditorStore()
  const { setActiveChannel, clearActiveUsers } = useRealtimeStore()
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false)
  const router = useRouter()
  
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
    if (!currentNote) {
      // Clean up if no note is selected
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      return
    }

    // Subscribe to real-time updates
    const channel = subscribeToNoteUpdates(currentNote.id, (payload) => {
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
  }, [currentNote?.id, setActiveChannel, clearActiveUsers, setRemoteUpdate, updateNoteInStore])

  // Navigate to note detail page when note is selected (only on initial selection)
  const previousNoteIdRef = useRef<string | null>(null)
  useEffect(() => {
    if (currentNote && currentNote.id !== previousNoteIdRef.current) {
      previousNoteIdRef.current = currentNote.id
      router.push(`/notes/${currentNote.id}`)
    }
  }, [currentNote?.id, router])

  // Memoized title update handler to prevent unnecessary re-renders
  const handleTitleUpdate = useCallback(
    (newTitle: string) => {
      if (currentNote) {
        updateNote(currentNote.id, { title: newTitle })
      }
    },
    [currentNote?.id, updateNote]
  )

  if (!currentNote) {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
        <Sidebar />
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p className="text-lg mb-2">No note selected</p>
            <p className="text-sm">Select a note from the sidebar or create a new one</p>
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
