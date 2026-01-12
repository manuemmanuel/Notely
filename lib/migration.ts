import { supabase } from './supabase'

/**
 * Migrate notes from anonymous ID to authenticated user ID
 * This is called automatically when a user signs in
 */
export async function migrateNotesToUser(authUserId: string): Promise<void> {
  if (typeof window === 'undefined') return

  const anonymousId = localStorage.getItem('notely_anonymous_id')
  
  if (!anonymousId) {
    // No anonymous notes to migrate
    return
  }

  try {
    // Find all notes created with the anonymous ID
    const { data: notes, error: fetchError } = await supabase
      .from('notes')
      .select('id')
      .eq('created_by', anonymousId)

    if (fetchError) {
      console.error('Error fetching notes for migration:', fetchError)
      return
    }

    if (!notes || notes.length === 0) {
      // No notes to migrate
      return
    }

    // Update all notes to use the authenticated user ID
    const noteIds = notes.map((n) => n.id)
    const { error: updateError } = await supabase
      .from('notes')
      .update({ created_by: authUserId })
      .in('id', noteIds)

    if (updateError) {
      console.error('Error migrating notes:', updateError)
      return
    }

    // Migration successful - clear anonymous ID (optional, keep it for fallback)
    // localStorage.removeItem('notely_anonymous_id')
    
    console.log(`Successfully migrated ${notes.length} note(s) to user ${authUserId}`)
  } catch (error) {
    console.error('Error during note migration:', error)
  }
}

