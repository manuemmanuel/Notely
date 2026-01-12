'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import { useEffect, useRef } from 'react'
import { useEditorStore } from '@/stores/editor.store'
import { CustomListItem } from '@/lib/tiptap-extensions/CustomListItem'

interface TipTapEditorProps {
  noteId: string | null
  initialContent: any
  onUpdate: (content: any) => void
}

export function TipTapEditor({ noteId, initialContent, onUpdate }: TipTapEditorProps) {
  const { setEditor, setRemoteUpdate, isRemoteUpdate } = useEditorStore()
  const previousNoteIdRef = useRef<string | null>(null)
  const isInitializedRef = useRef(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // We provide underline via a dedicated extension
        underline: false,
        // Disable default ListItem - we'll use CustomListItem instead
        listItem: false,
        // Ensure BulletList and OrderedList are enabled with proper configuration
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      // Use custom ListItem with Backspace handling
      CustomListItem.configure({
        HTMLAttributes: {
          class: 'list-item',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: initialContent,
    autofocus: 'end',
    editorProps: {
      attributes: {
        class: 'prose prose-lg max-w-none focus:outline-none min-h-[600px] prose-gray dark:prose-invert',
      },
    },
    onUpdate: ({ editor }) => {
      if (!isRemoteUpdate) {
        const json = editor.getJSON()
        onUpdate(json)
      }
    },
  })

  // Initialize editor content only when note changes (not on every content update)
  useEffect(() => {
    if (!editor || !noteId) return

    // If this is a new note (noteId changed), initialize the editor
    if (noteId !== previousNoteIdRef.current) {
      previousNoteIdRef.current = noteId
      isInitializedRef.current = false
    }

    // Only set content if we haven't initialized for this note yet
    if (!isInitializedRef.current && initialContent) {
      editor.commands.setContent(initialContent, false)
      editor.commands.focus('end')
      isInitializedRef.current = true
    }
  }, [noteId, editor, initialContent])

  useEffect(() => {
    if (editor) {
      setEditor(editor)
    }
    return () => {
      setEditor(null)
    }
  }, [editor, setEditor])

  // Update editor content when remote changes arrive
  useEffect(() => {
    if (!editor || !initialContent || !isRemoteUpdate) return

    const currentContent = editor.getJSON()
    const currentContentStr = JSON.stringify(currentContent)
    const newContentStr = JSON.stringify(initialContent)

    // Only update if content actually changed and it's a remote update
    if (currentContentStr !== newContentStr) {
      editor.commands.setContent(initialContent, false)
      setRemoteUpdate(false)
    }
  }, [editor, initialContent, isRemoteUpdate, setRemoteUpdate])

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    )
  }

  return (
    <div
      className="w-full"
      onMouseDown={(event) => {
        // If the user clicks on the editor container (empty area), focus the editor
        if (event.target === event.currentTarget) {
          event.preventDefault()
          editor.chain().focus('end').run()
        }
      }}
    >
      <EditorContent editor={editor} />
    </div>
  )
}
