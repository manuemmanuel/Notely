'use client'

import { useState } from 'react'
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, useDisclosure } from '@heroui/react'
import { Share2, Copy, Check, X } from 'lucide-react'
import { useNotesStore } from '@/stores/notes.store'

export function ShareButton() {
  const { currentNote, shareNote, unshareNote } = useNotesStore()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [isLoading, setIsLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!currentNote) return null

  const isShared = !!currentNote.share_token
  const shareUrl = currentNote.share_token
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/notes/${currentNote.id}?share=${currentNote.share_token}`
    : ''

  const handleShare = async () => {
    if (isShared) {
      // Unshare
      setIsLoading(true)
      await unshareNote(currentNote.id)
      setIsLoading(false)
      onClose()
    } else {
      // Share
      setIsLoading(true)
      const token = await shareNote(currentNote.id)
      setIsLoading(false)
      if (token) {
        onOpen()
      }
    }
  }

  const handleCopyLink = async () => {
    if (shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (error) {
        console.error('Failed to copy link:', error)
      }
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant={isShared ? 'solid' : 'light'}
        onPress={handleShare}
        isLoading={isLoading}
        className="text-gray-600 dark:text-gray-400 min-w-0 h-8 w-8 p-0"
        isIconOnly
        aria-label={isShared ? 'Unshare note' : 'Share note'}
      >
        <Share2 size={16} />
      </Button>

      {isShared && (
        <Modal isOpen={isOpen} onClose={onClose} placement="center">
          <ModalContent>
            <ModalHeader className="flex flex-col gap-1">Share Note</ModalHeader>
            <ModalBody>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Anyone with this link can view and edit this note in real-time.
              </p>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1"
                  classNames={{
                    input: 'text-sm',
                  }}
                />
                <Button
                  size="sm"
                  variant="flat"
                  onPress={handleCopyLink}
                  isIconOnly
                  aria-label="Copy link"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </Button>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                onPress={() => {
                  handleShare()
                }}
                startContent={<X size={16} />}
              >
                Stop Sharing
              </Button>
              <Button variant="flat" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </>
  )
}

