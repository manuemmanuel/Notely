'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { Button, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, useDisclosure } from '@heroui/react'
import { supabase } from '@/lib/supabase'

export function AuthButton() {
  const { user, isAuthenticated, authLoading, signIn, signOut } = useAuthStore()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSignIn = async () => {
    if (!email) return

    setIsSubmitting(true)
    setMessage('')

    const { error } = await signIn(email)

    if (error) {
      setMessage(error.message || 'Failed to send magic link')
      setIsSubmitting(false)
    } else {
      setMessage('Check your email for the magic link!')
      // Keep modal open so user can see the message
    }
  }

  const handleSignOut = async () => {
    await signOut()
    onClose()
  }

  const handleClose = () => {
    setEmail('')
    setMessage('')
    onClose()
  }

  // Check if user just confirmed their email (magic link clicked)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        handleClose()
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  if (authLoading) {
    return (
      <Button size="sm" variant="flat" isLoading>
        Loading...
      </Button>
    )
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          {user.email}
        </span>
        <Button size="sm" variant="light" onPress={handleSignOut} className="text-xs">
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <>
      <Button size="sm" variant="light" onPress={onOpen} className="text-xs font-medium">
        Sign in to sync
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} placement="center">
        <ModalContent>
          <ModalHeader>Sign in to sync your notes</ModalHeader>
          <ModalBody>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter your email to receive a magic link. Your notes will be automatically synced across devices.
            </p>
            <Input
              type="email"
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSignIn()
                }
              }}
            />
            {message && (
              <p className={`text-sm mt-2 ${message.includes('Check') ? 'text-green-600' : 'text-red-600'}`}>
                {message}
              </p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleClose}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSignIn} isLoading={isSubmitting}>
              Send magic link
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

