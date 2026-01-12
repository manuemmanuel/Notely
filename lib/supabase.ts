import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Note = {
  id: string
  title: string
  content: any // TipTap JSON
  updated_at: string
  created_by: string | null
  is_favorite: boolean
  deleted_at: string | null
  share_token: string | null
}

export type NoteVersion = {
  id: string
  note_id: string
  content: any // TipTap JSON
  created_at: string
}

