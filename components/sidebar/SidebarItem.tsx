'use client'

import { Note } from '@/lib/supabase'
import { useNotesStore } from '@/stores/notes.store'
import { Star, Trash2, RotateCcw } from 'lucide-react'
import { useState } from 'react'

interface SidebarItemProps {
  note: Note
  isActive: boolean
  onClick: () => void
}

export function SidebarItem({ note, isActive, onClick }: SidebarItemProps) {
  const { toggleFavorite, deleteNote, restoreNote } = useNotesStore()
  const [isHovered, setIsHovered] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m`
    if (diffHours < 24) return `${diffHours}h`
    if (diffDays < 7) return `${diffDays}d`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleFavorite(note.id)
  }

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (note.deleted_at) {
      restoreNote(note.id)
    } else {
      deleteNote(note.id)
    }
  }

  const isDeleted = note.deleted_at !== null

  return (
    <div
      className={`group relative w-full rounded-md transition-all duration-150 ${
        isActive
          ? 'bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        onClick={onClick}
        className={`w-full text-left px-3 py-2 transition-all duration-150 ${
          isActive
            ? 'text-gray-900 dark:text-gray-50'
            : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        <div className="flex items-center gap-2 mb-0.5">
          <div className="font-medium text-sm truncate leading-tight flex-1">
            {note.title || 'Untitled Note'}
          </div>
          {note.is_favorite && !isDeleted && (
            <Star size={12} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
          )}
        </div>
        <div className={`text-xs ${isActive ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400 dark:text-gray-500'}`}>
          {formatDate(note.updated_at)}
        </div>
      </button>

      {/* Action buttons - show on hover */}
      {(isHovered || isActive) && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-200 dark:border-gray-700 p-1">
          {!isDeleted ? (
            <>
              <button
                onClick={handleFavoriteClick}
                className={`p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  note.is_favorite ? 'text-yellow-500' : 'text-gray-400 dark:text-gray-500'
                }`}
                aria-label={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                title={note.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star size={14} className={note.is_favorite ? 'fill-current' : ''} />
              </button>
              <button
                onClick={handleDeleteClick}
                className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400"
                aria-label="Delete note"
                title="Delete note"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <button
              onClick={handleDeleteClick}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 dark:text-gray-500 hover:text-green-500 dark:hover:text-green-400"
              aria-label="Restore note"
              title="Restore note"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
