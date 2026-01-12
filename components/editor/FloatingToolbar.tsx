'use client'

import { useState } from 'react'
import { useEditorStore } from '@/stores/editor.store'
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, useDisclosure } from '@heroui/react'
import { Bold, Italic, Underline, AlignLeft, List, ListOrdered, Search } from 'lucide-react'

export function FloatingToolbar() {
  const { editor } = useEditorStore()
  const [searchTerm, setSearchTerm] = useState<string | null>(null)
  const [lastSearchPos, setLastSearchPos] = useState<number>(0)
  const [searchInput, setSearchInput] = useState('')
  const { isOpen, onOpen, onClose } = useDisclosure()

  // If no editor yet, don't render the toolbar to avoid null access and hook mismatches
  if (!editor) {
    return null
  }

  const handleToggleUnderline = () => {
    if (!editor) return
    editor.chain().focus().toggleUnderline().run()
  }

  const handleToggleAlignmentCycle = () => {
    if (!editor) return

    const paragraphAlign = editor.getAttributes('paragraph')?.textAlign
    const headingAlign = editor.getAttributes('heading')?.textAlign
    const current = paragraphAlign || headingAlign || 'left'

    const next =
      current === 'left'
        ? 'center'
        : current === 'center'
        ? 'right'
        : 'left'

    editor.chain().focus().setTextAlign(next).run()
  }

  const handleSearchClick = () => {
    if (!editor) return

    // If we already have a search term, continue searching
    if (searchTerm) {
      performSearch(searchTerm)
      return
    }

    // Otherwise, open the dialog to get a new search term
    onOpen()
  }

  const handleSearchSubmit = () => {
    const term = searchInput.trim()
    if (!term || !editor) return

    setSearchTerm(term)
    setLastSearchPos(0)
    onClose()
    setSearchInput('')
    
    // Perform the search after a brief delay to ensure modal is closed
    setTimeout(() => {
      performSearch(term)
    }, 100)
  }

  const handleSearchCancel = () => {
    setSearchInput('')
    onClose()
  }

  const performSearch = (term: string) => {
    if (!editor) return

    const { state } = editor
    const doc = state.doc
    const docSize = doc.content.size
    const startPos = lastSearchPos || 0
    const lowerTerm = term.toLowerCase()

    let foundFrom: number | null = null
    let foundTo: number | null = null

    const searchFrom = (fromPos: number): boolean => {
      let found = false
      doc.descendants((node, pos) => {
        if (found || !node.isText) return false

        const text = node.text || ''
        const lowerText = text.toLowerCase()

        // Skip text before fromPos
        const offset = Math.max(0, fromPos - pos)
        const index = lowerText.indexOf(lowerTerm, offset)

        if (index !== -1) {
          foundFrom = pos + index
          foundTo = foundFrom + term!.length
          found = true
          return false
        }
        return false
      })
      return found
    }

    // Try from current position to end
    const foundForward = searchFrom(startPos)

    // If not found, wrap around to start
    if (!foundForward && startPos > 0) {
      const foundWrapped = searchFrom(0)
      if (!foundWrapped) {
        return
      }
    } else if (!foundForward) {
      return
    }

    if (foundFrom != null && foundTo != null) {
      editor.chain().focus().setTextSelection({ from: foundFrom, to: foundTo }).run()
      const nextPos = foundTo < docSize ? foundTo : 0
      setLastSearchPos(nextPos)
    }
  }

  const handleClearSearch = () => {
    setSearchTerm(null)
    setLastSearchPos(0)
    setSearchInput('')
  }

  const isUnderlineActive = editor ? editor.isActive('underline') : false
  const isAlignCenter = editor ? editor.isActive({ textAlign: 'center' }) : false
  const isAlignRight = editor ? editor.isActive({ textAlign: 'right' }) : false
  const isAlignActive = isAlignCenter || isAlignRight

  return (
    <div className="sticky top-6 z-20 flex justify-center mb-8">
      <div className="bg-white dark:bg-gray-800 border border-gray-200/80 dark:border-gray-700/80 rounded-xl shadow-lg px-2 py-1.5 flex items-center gap-0.5 backdrop-blur-sm">
        {/* Text Formatting Group */}
        <div className="flex items-center gap-0.5 px-1">
          <Button
            size="sm"
            variant={editor.isActive('bold') ? 'solid' : 'light'}
            onPress={() => editor.chain().focus().toggleBold().run()}
            className="min-w-0 h-8 w-8 p-0"
            isIconOnly
          >
            <Bold size={16} />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('italic') ? 'solid' : 'light'}
            onPress={() => editor.chain().focus().toggleItalic().run()}
            className="min-w-0 h-8 w-8 p-0"
            isIconOnly
          >
            <Italic size={16} />
          </Button>
          <Button
            size="sm"
            variant={isUnderlineActive ? 'solid' : 'light'}
            onPress={handleToggleUnderline}
            className="min-w-0 h-8 w-8 p-0"
            isIconOnly
          >
            <Underline size={16} />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Lists Group */}
        <div className="flex items-center gap-0.5 px-1">
          <Button
            size="sm"
            variant={editor.isActive('bulletList') ? 'solid' : 'light'}
            onPress={() => editor.chain().focus().toggleBulletList().run()}
            className="min-w-0 h-8 w-8 p-0"
            isIconOnly
          >
            <List size={16} />
          </Button>
          <Button
            size="sm"
            variant={editor.isActive('orderedList') ? 'solid' : 'light'}
            onPress={() => editor.chain().focus().toggleOrderedList().run()}
            className="min-w-0 h-8 w-8 p-0"
            isIconOnly
          >
            <ListOrdered size={16} />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Alignment Group */}
        <div className="flex items-center gap-0.5 px-1">
          <Button
            size="sm"
            variant={isAlignActive ? 'solid' : 'light'}
            onPress={handleToggleAlignmentCycle}
            className="min-w-0 h-8 w-8 p-0"
            isIconOnly
          >
            <AlignLeft size={16} />
          </Button>
        </div>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Search */}
        <div className="flex items-center gap-0.5 px-1">
          <Button
            size="sm"
            variant={searchTerm ? 'solid' : 'light'}
            className="min-w-0 h-8 w-8 p-0"
            isIconOnly
            onPress={handleSearchClick}
            title={searchTerm ? `Search: "${searchTerm}" (click to find next)` : 'Search in note'}
          >
            <Search size={16} />
          </Button>
          {searchTerm && (
            <button
              onClick={handleClearSearch}
              className="ml-1 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Search Dialog */}
      <Modal isOpen={isOpen} onClose={handleSearchCancel} placement="center" size="md">
        <ModalContent>
          <ModalHeader>Search in note</ModalHeader>
          <ModalBody>
            <Input
              type="text"
              label="Search term"
              placeholder="Enter text to search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearchSubmit()
                }
              }}
              autoFocus
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleSearchCancel}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleSearchSubmit}
              isDisabled={!searchInput.trim()}
            >
              Search
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
