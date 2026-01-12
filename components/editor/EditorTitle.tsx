'use client'

import { useState, useEffect, useRef } from 'react'
import { Pencil } from 'lucide-react'

interface EditorTitleProps {
  noteId: string
  title: string
  onChange: (title: string) => void
  placeholder?: string
}

export function EditorTitle({ noteId, title, onChange, placeholder = 'Untitled' }: EditorTitleProps) {
  // Local draft state to isolate typing from global store updates
  const [titleDraft, setTitleDraft] = useState(title)
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const previousNoteIdRef = useRef<string>(noteId)
  const isTypingRef = useRef(false)

  // Sync draft ONLY when noteId actually changes AND we're not editing
  // This is the critical fix: never sync while user is typing
  useEffect(() => {
    // Only sync if noteId actually changed (not just a re-render from store update)
    if (noteId !== previousNoteIdRef.current) {
      previousNoteIdRef.current = noteId
      // Only sync if we're not currently editing/typing
      if (!isEditing && !isTypingRef.current) {
        setTitleDraft(title)
      }
    }
    // CRITICAL: Never sync when title prop changes due to store updates
    // We only sync on noteId change, never on title prop changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteId])

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // CRITICAL: Set typing flag BEFORE updating state to prevent any sync
    isTypingRef.current = true
    const newValue = e.target.value
    setTitleDraft(newValue)
    // Reset typing flag after debounce completes (longer than debounce delay)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false
    }, 700) // Longer than debounce delay (500ms) to ensure sync is blocked
  }

  const handleBlur = () => {
    setIsEditing(false)
    isTypingRef.current = false
    // Clear all timeouts
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    // Ensure final value is saved immediately on blur
    onChange(titleDraft)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
    }
    if (e.key === 'Escape') {
      // Revert to the prop title (last saved value)
      // Only revert if we're on the same note (not switching notes)
      if (previousNoteIdRef.current === noteId) {
        setTitleDraft(title)
      }
      isTypingRef.current = false
      e.currentTarget.blur()
    }
  }

  // Debounce persistence while typing (does not affect local rendering)
  useEffect(() => {
    if (!isEditing) return
    
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }
    
    // Set new debounce timeout
    debounceTimeoutRef.current = setTimeout(() => {
      // Only call onChange if we're still editing and not typing
      if (isEditing && !isTypingRef.current) {
        onChange(titleDraft)
      }
    }, 500)
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [titleDraft, isEditing, onChange])

  return (
    <div className="group relative mb-6">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={titleDraft}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsEditing(true)
            isTypingRef.current = true
          }}
          className="w-full text-3xl font-serif font-normal text-gray-900 dark:text-gray-50 bg-transparent border-none outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600 focus:ring-0 transition-all"
          placeholder={placeholder}
        />
        {!isEditing && (
          <button
            onClick={() => {
              setIsEditing(true)
              setTimeout(() => inputRef.current?.focus(), 0)
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Rename note"
          >
            <Pencil size={16} />
          </button>
        )}
      </div>
    </div>
  )
}
