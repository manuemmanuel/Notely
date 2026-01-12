'use client'

import { useEffect } from 'react'
import { useNotesStore } from '@/stores/notes.store'
import { Card, CardBody, Button, Spinner } from '@heroui/react'

export function NotesList() {
  const { notes, isLoading, currentNote, fetchNotes, createNote, setCurrentNote } = useNotesStore()

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  const handleCreateNote = async () => {
    const newNote = await createNote()
    if (newNote) {
      // Note is already set as current in the store
    }
  }

  const handleSelectNote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (note) {
      setCurrentNote(note)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="w-64 h-screen border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <Button
          color="primary"
          variant="solid"
          onPress={handleCreateNote}
          className="w-full"
        >
          New Note
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center p-4">
            <Spinner size="sm" />
          </div>
        ) : notes.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No notes yet. Create one to get started!
          </div>
        ) : (
          <div className="p-2">
            {notes.map((note) => (
              <Card
                key={note.id}
                isPressable
                onPress={() => handleSelectNote(note.id)}
                className={`mb-2 cursor-pointer transition-all ${
                  currentNote?.id === note.id
                    ? 'ring-2 ring-primary'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <CardBody className="p-3">
                  <div className="font-semibold text-sm truncate mb-1">
                    {note.title || 'Untitled Note'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(note.updated_at)}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

