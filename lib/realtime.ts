import { supabase, type Note } from './supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

export type RealtimeCallback = (payload: { new: Note; old: Note }) => void

export function subscribeToNoteUpdates(
  noteId: string,
  callback: RealtimeCallback
): RealtimeChannel {
  const channel = supabase
    .channel(`note:${noteId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'notes',
        filter: `id=eq.${noteId}`,
      },
      (payload) => {
        callback({
          new: payload.new as Note,
          old: payload.old as Note,
        })
      }
    )
    .subscribe()

  return channel
}

export function unsubscribeFromNoteUpdates(channel: RealtimeChannel) {
  supabase.removeChannel(channel)
}

