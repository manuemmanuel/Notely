'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase, type NoteVersion } from '@/lib/supabase'
import { useNotesStore } from '@/stores/notes.store'
import { saveVersionBeforeRestore } from '@/lib/versions'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  Button,
  Card,
  CardBody,
  Spinner,
} from '@heroui/react'

interface VersionHistoryProps {
  noteId: string | null
  isOpen: boolean
  onClose: () => void
}

export function VersionHistory({ noteId, isOpen, onClose }: VersionHistoryProps) {
  const [versions, setVersions] = useState<NoteVersion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState<string | null>(null)
  const { fetchNote, updateNote } = useNotesStore()

  const fetchVersions = useCallback(async () => {
    if (!noteId) {
      setVersions([])
      return
    }

    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('note_versions')
        .select('*')
        .eq('note_id', noteId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching versions:', error)
        setVersions([])
        return
      }
      
      setVersions(data || [])
    } catch (error: any) {
      console.error('Error fetching versions:', error)
      setVersions([])
    } finally {
      setIsLoading(false)
    }
  }, [noteId])

  useEffect(() => {
    if (isOpen && noteId) {
      fetchVersions()
    } else {
      setVersions([])
    }
  }, [isOpen, noteId, fetchVersions])

  const handleRestore = async (version: NoteVersion) => {
    if (!noteId) return

    setIsRestoring(version.id)
    try {
      // Create a new version snapshot before restoring
      const currentNote = await fetchNote(noteId)
      if (currentNote) {
        await saveVersionBeforeRestore(noteId, currentNote.content)
      }

      // Restore the version
      await updateNote(noteId, { content: version.content })
      
      // Refresh versions list
      await fetchVersions()
      
      // Refresh the note
      await fetchNote(noteId)
    } catch (error: any) {
      console.error('Error restoring version:', error)
    } finally {
      setIsRestoring(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  const getPreviewText = (content: any): string => {
    if (!content || !content.content) return 'Empty'
    
    const extractText = (node: any): string => {
      if (node.type === 'text') return node.text || ''
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join(' ')
      }
      return ''
    }

    const text = extractText(content)
    return text.length > 100 ? text.substring(0, 100) + '...' : text || 'Empty'
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
      <DrawerContent>
        <DrawerHeader className="border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Version History</h2>
        </DrawerHeader>
        <DrawerBody>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Spinner size="lg" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center text-gray-500 p-8">
              No version history available for this note.
            </div>
          ) : (
            <div className="space-y-3">
              {versions.map((version) => (
                <Card key={version.id}>
                  <CardBody className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {formatDate(version.created_at)}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getPreviewText(version.content)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        color="primary"
                        variant="flat"
                        onPress={() => handleRestore(version)}
                        isLoading={isRestoring === version.id}
                      >
                        Restore
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

