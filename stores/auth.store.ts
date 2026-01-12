import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import { initializeAnonymousUser } from '@/lib/auth'

interface AuthState {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  authLoading: boolean
  isMigrating: boolean
  
  // Actions
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setAuthLoading: (loading: boolean) => void
  setMigrating: (migrating: boolean) => void
  signIn: (email: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => {
  // Initialize anonymous user on store creation
  if (typeof window !== 'undefined') {
    initializeAnonymousUser()
  }

  return {
    user: null,
    session: null,
    isAuthenticated: false,
    authLoading: true,
    isMigrating: false,

    setUser: (user) => {
      set({ user, isAuthenticated: !!user })
    },

    setSession: (session) => {
      set({ session, user: session?.user ?? null, isAuthenticated: !!session?.user })
    },

    setAuthLoading: (loading) => {
      set({ authLoading: loading })
    },

    setMigrating: (migrating) => {
      set({ isMigrating: migrating })
    },

    signIn: async (email: string) => {
      try {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
        })
        return { error }
      } catch (error: any) {
        return { error }
      }
    },

    signOut: async () => {
      try {
        await supabase.auth.signOut()
        set({ user: null, session: null, isAuthenticated: false })
        // Re-initialize anonymous user after sign out
        if (typeof window !== 'undefined') {
          initializeAnonymousUser()
        }
      } catch (error) {
        console.error('Error signing out:', error)
      }
    },

    checkSession: async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        get().setSession(session)
      } catch (error) {
        console.error('Error checking session:', error)
        set({ authLoading: false })
      }
    },
  }
})

