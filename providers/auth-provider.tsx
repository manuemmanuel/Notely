'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth.store'
import { migrateNotesToUser } from '@/lib/migration'
import { initializeAnonymousUser } from '@/lib/auth'
import { useNotesStore } from '@/stores/notes.store'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setAuthLoading, setMigrating } = useAuthStore()
  const hasMigratedRef = useRef(false)
  const previousAuthStateRef = useRef(false)

  useEffect(() => {
    // Initialize anonymous user on mount
    initializeAnonymousUser()

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error getting session:', error)
        setAuthLoading(false)
        return
      }

      previousAuthStateRef.current = !!session?.user
      setSession(session)
      setAuthLoading(false)

      // If user is already signed in, migrate notes if not already done
      if (session?.user && !hasMigratedRef.current) {
        handleUserSignIn(session.user.id)
        hasMigratedRef.current = true
      }
    })

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const wasAuthenticated = previousAuthStateRef.current
      previousAuthStateRef.current = !!session?.user
      
      setSession(session)
      setAuthLoading(false)

      if (event === 'SIGNED_IN' && session?.user && !wasAuthenticated && !hasMigratedRef.current) {
        // User just signed in - migrate their notes
        await handleUserSignIn(session.user.id)
        hasMigratedRef.current = true
      } else if (event === 'SIGNED_OUT') {
        // User signed out - re-initialize anonymous user
        initializeAnonymousUser()
        hasMigratedRef.current = false
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleUserSignIn = async (userId: string) => {
    setMigrating(true)
    try {
      await migrateNotesToUser(userId)
      // Refresh notes after migration
      const { fetchNotes } = useNotesStore.getState()
      await fetchNotes()
    } catch (error) {
      console.error('Error during note migration:', error)
    } finally {
      setMigrating(false)
    }
  }

  return <>{children}</>
}
