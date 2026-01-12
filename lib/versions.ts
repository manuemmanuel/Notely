import { supabase } from './supabase'
import type { Note } from './supabase'

const VERSION_INTERVAL_MS = 5 * 60 * 1000 // 5 minutes

let lastVersionSave: Map<string, number> = new Map()

export async function saveVersionIfNeeded(noteId: string, content: any): Promise<void> {
  const now = Date.now()
  const lastSave = lastVersionSave.get(noteId) || 0
  const timeSinceLastSave = now - lastSave

  // Only save version if enough time has passed
  if (timeSinceLastSave < VERSION_INTERVAL_MS) {
    return
  }

  try {
    await supabase.from('note_versions').insert({
      note_id: noteId,
      content,
    })

    lastVersionSave.set(noteId, now)
  } catch (error) {
    console.error('Error saving version:', error)
  }
}

export async function saveVersionManually(noteId: string, content: any): Promise<void> {
  try {
    await supabase.from('note_versions').insert({
      note_id: noteId,
      content,
    })

    lastVersionSave.set(noteId, Date.now())
  } catch (error) {
    console.error('Error saving version manually:', error)
  }
}

export async function saveVersionBeforeRestore(noteId: string, currentContent: any): Promise<void> {
  try {
    await supabase.from('note_versions').insert({
      note_id: noteId,
      content: currentContent,
    })
  } catch (error) {
    console.error('Error saving version before restore:', error)
  }
}

