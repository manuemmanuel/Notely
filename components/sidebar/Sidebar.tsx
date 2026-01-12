'use client'

import { useState, useEffect } from 'react'
import { useNotesStore } from '@/stores/notes.store'
import { Button, Spinner, Chip } from '@heroui/react'
import { SidebarItem } from './SidebarItem'
import { SidebarSection } from './SidebarSection'
import { ChevronLeft, ChevronRight, Star, Trash2, FileText, Plus } from 'lucide-react'

type SidebarSectionType = 'all' | 'notebook' | 'favorites' | 'deleted'

export function Sidebar() {
  const { notes, isLoading, currentNote, fetchNotes, createNote, setCurrentNote } = useNotesStore()
  const [activeSection, setActiveSection] = useState<SidebarSectionType>('all')
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Load notes on mount and when section changes
  useEffect(() => {
    fetchNotes(activeSection === 'deleted')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])
  
  // Initial load on mount
  useEffect(() => {
    fetchNotes(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCreateNote = async () => {
    const newNote = await createNote()
    if (newNote) {
      setCurrentNote(newNote)
    }
  }

  const handleSelectNote = (noteId: string) => {
    const note = notes.find((n) => n.id === noteId)
    if (note) {
      setCurrentNote(note)
    }
  }

  // Filter notes based on active section
  const getFilteredNotes = () => {
    switch (activeSection) {
      case 'all':
        return notes.filter((n) => !n.deleted_at)
      case 'notebook':
        return notes.filter((n) => !n.deleted_at) // For now, same as all. Can add notebook logic later
      case 'favorites':
        return notes.filter((n) => n.is_favorite && !n.deleted_at)
      case 'deleted':
        return notes.filter((n) => n.deleted_at !== null)
      default:
        return notes.filter((n) => !n.deleted_at)
    }
  }

  const filteredNotes = getFilteredNotes()
  const favoriteCount = notes.filter((n) => n.is_favorite && !n.deleted_at).length
  const deletedCount = notes.filter((n) => n.deleted_at !== null).length

  return (
    <div className={`${isCollapsed ? 'w-[60px]' : 'w-64'} h-screen bg-gray-100/50 dark:bg-gray-900/50 border-r border-gray-200/80 dark:border-gray-800/80 flex flex-col backdrop-blur-sm transition-all duration-300 relative overflow-visible`}>
      {/* Collapse Toggle Button - Only visible when expanded */}
      {!isCollapsed && (
        <div className="absolute top-3 right-3 z-[100] flex items-center justify-center">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-8 h-8 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
          >
            <ChevronLeft size={16} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      )}

      {!isCollapsed && (
        <>
          {/* Notely Branding */}
          <div className="px-5 py-4 border-b border-gray-200/60 dark:border-gray-800/60">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50 tracking-tight">Notely</h1>
          </div>

          {/* Sections */}
          <div className="flex-1 overflow-y-auto py-3">
            <div className="px-2 space-y-1">
              <SidebarSection
                title="All Notes"
                isActive={activeSection === 'all'}
                onClick={() => setActiveSection('all')}
                count={notes.filter((n) => !n.deleted_at).length}
              />
              <SidebarSection
                title="Notebook"
                isActive={activeSection === 'notebook'}
                onClick={() => setActiveSection('notebook')}
                count={notes.filter((n) => !n.deleted_at).length}
              />
              <SidebarSection
                title="Favorites"
                isActive={activeSection === 'favorites'}
                onClick={() => setActiveSection('favorites')}
                count={favoriteCount}
              />
              <SidebarSection
                title="Deleted"
                isActive={activeSection === 'deleted'}
                onClick={() => setActiveSection('deleted')}
                count={deletedCount}
              />
            </div>

            {/* Separator */}
            <div className="px-4 my-3">
              <div className="h-px bg-gray-200/60 dark:bg-gray-800/60" />
            </div>

            {/* Notes List */}
            <div className="px-2">
              {isLoading ? (
                <div className="flex justify-center p-6">
                  <Spinner size="sm" />
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="px-3 py-6 text-center text-gray-400 dark:text-gray-500 text-xs">
                  {activeSection === 'deleted' ? 'No deleted notes' : activeSection === 'favorites' ? 'No favorites yet' : 'No notes yet'}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredNotes.map((note) => (
                    <SidebarItem
                      key={note.id}
                      note={note}
                      isActive={currentNote?.id === note.id}
                      onClick={() => handleSelectNote(note.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* New Note Button */}
          <div className="p-3 border-t border-gray-200/60 dark:border-gray-800/60 bg-gray-50/30 dark:bg-gray-900/30">
            <Button
              color="primary"
              variant="solid"
              onPress={handleCreateNote}
              className="w-full font-medium shadow-sm"
              size="md"
            >
              + New Note
            </Button>
          </div>
        </>
      )}

      {isCollapsed && (
        <div className="flex flex-col h-full pt-3 pb-3">
          {/* Navigation Icons */}
          <div className="flex-1 flex flex-col items-center gap-1 px-2">
            {/* Expand Button - First in the column */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <ChevronRight size={20} />
            </button>

            <button
              onClick={() => setActiveSection('all')}
              className={`group relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                activeSection === 'all'
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-50 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
              title="All Notes"
              aria-label="All Notes"
            >
              <FileText size={20} className={activeSection === 'all' ? 'text-gray-900 dark:text-gray-50' : ''} />
              {activeSection === 'all' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
              )}
            </button>

            <button
              onClick={() => setActiveSection('favorites')}
              className={`group relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                activeSection === 'favorites'
                  ? 'bg-gray-200 dark:bg-gray-800 text-yellow-600 dark:text-yellow-500 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-yellow-600 dark:hover:text-yellow-500'
              }`}
              title="Favorites"
              aria-label="Favorites"
            >
              <Star 
                size={20} 
                className={activeSection === 'favorites' ? 'fill-current text-yellow-600 dark:text-yellow-500' : ''} 
              />
              {activeSection === 'favorites' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
              )}
            </button>

            <button
              onClick={() => setActiveSection('deleted')}
              className={`group relative w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
                activeSection === 'deleted'
                  ? 'bg-gray-200 dark:bg-gray-800 text-red-600 dark:text-red-500 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/70 hover:text-red-600 dark:hover:text-red-500'
              }`}
              title="Deleted"
              aria-label="Deleted"
            >
              <Trash2 size={20} />
              {activeSection === 'deleted' && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
              )}
            </button>
          </div>

          {/* New Note Button */}
          <div className="px-2 pt-2 border-t border-gray-200/60 dark:border-gray-800/60">
            <button
              onClick={handleCreateNote}
              className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center hover:bg-primary-600 active:scale-95 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              title="New Note"
              aria-label="New Note"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
