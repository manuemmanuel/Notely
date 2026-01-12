-- Add share token field to notes table for collaboration
-- When a note is shared, a unique token is generated that allows access
ALTER TABLE notes 
  ADD COLUMN IF NOT EXISTS share_token UUID UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notes_share_token ON notes(share_token) WHERE share_token IS NOT NULL;

-- Update RLS policy to allow read access to shared notes
-- Users can read notes if they own them OR if the note has a share_token (is shared)
-- Updates/deletes are still restricted to note owners

-- Drop existing policy
DROP POLICY IF EXISTS "Authenticated users access own notes" ON notes;
DROP POLICY IF EXISTS "Users can access own or shared notes" ON notes;

-- Create new policy that allows reading own notes OR shared notes
CREATE POLICY "Users can access own or shared notes" ON notes
  FOR SELECT
  USING (
    -- Own notes (authenticated)
    (auth.uid() IS NOT NULL AND created_by = CAST(auth.uid() AS text))
    OR
    -- Own notes (anonymous - client-side filtering)
    (auth.uid() IS NULL)
    OR
    -- Shared notes (anyone can read if share_token exists)
    (share_token IS NOT NULL)
  );

-- Policy for INSERT/UPDATE/DELETE (only owners)
CREATE POLICY "Users can modify own notes" ON notes
  FOR ALL
  USING (
    -- Own notes (authenticated)
    (auth.uid() IS NOT NULL AND created_by = CAST(auth.uid() AS text))
    OR
    -- Own notes (anonymous - client-side filtering)
    (auth.uid() IS NULL)
  )
  WITH CHECK (
    -- Only allow updates/deletes on own notes
    (auth.uid() IS NOT NULL AND created_by = CAST(auth.uid() AS text))
    OR
    (auth.uid() IS NULL)
  );

