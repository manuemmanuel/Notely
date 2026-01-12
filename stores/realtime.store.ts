import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface PresenceUser {
  id: string
  name?: string
  color?: string
}

interface RealtimeState {
  activeChannel: RealtimeChannel | null
  activeUsers: Map<string, PresenceUser>
  isConnected: boolean
  
  // Actions
  setActiveChannel: (channel: RealtimeChannel | null) => void
  addActiveUser: (userId: string, user: PresenceUser) => void
  removeActiveUser: (userId: string) => void
  setConnected: (connected: boolean) => void
  clearActiveUsers: () => void
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  activeChannel: null,
  activeUsers: new Map(),
  isConnected: false,

  setActiveChannel: (channel) => set({ activeChannel: channel }),
  
  addActiveUser: (userId, user) =>
    set((state) => {
      const newUsers = new Map(state.activeUsers)
      newUsers.set(userId, user)
      return { activeUsers: newUsers }
    }),
  
  removeActiveUser: (userId) =>
    set((state) => {
      const newUsers = new Map(state.activeUsers)
      newUsers.delete(userId)
      return { activeUsers: newUsers }
    }),
  
  setConnected: (connected) => set({ isConnected: connected }),
  
  clearActiveUsers: () => set({ activeUsers: new Map() }),
}))

