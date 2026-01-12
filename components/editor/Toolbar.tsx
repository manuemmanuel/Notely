'use client'

import { useEditorStore } from '@/stores/editor.store'
import { Button } from '@heroui/react'

export function Toolbar() {
  const { editor } = useEditorStore()

  if (!editor) {
    return null
  }

  return (
    <div className="flex gap-2 p-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <Button
        size="sm"
        variant={editor.isActive('heading', { level: 1 }) ? 'solid' : 'light'}
        onPress={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        H1
      </Button>
      <Button
        size="sm"
        variant={editor.isActive('heading', { level: 2 }) ? 'solid' : 'light'}
        onPress={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        H2
      </Button>
      <Button
        size="sm"
        variant={editor.isActive('heading', { level: 3 }) ? 'solid' : 'light'}
        onPress={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        H3
      </Button>
      <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
      <Button
        size="sm"
        variant={editor.isActive('bold') ? 'solid' : 'light'}
        onPress={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </Button>
      <Button
        size="sm"
        variant={editor.isActive('italic') ? 'solid' : 'light'}
        onPress={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </Button>
      <div className="w-px bg-gray-300 dark:bg-gray-600 mx-1" />
      <Button
        size="sm"
        variant={editor.isActive('bulletList') ? 'solid' : 'light'}
        onPress={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </Button>
      <Button
        size="sm"
        variant={editor.isActive('orderedList') ? 'solid' : 'light'}
        onPress={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </Button>
      <Button
        size="sm"
        variant={editor.isActive('codeBlock') ? 'solid' : 'light'}
        onPress={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        {'</>'}
      </Button>
    </div>
  )
}

