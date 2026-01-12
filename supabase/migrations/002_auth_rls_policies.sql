-- Update RLS policies to support authenticated and anonymous users
-- Note: For MVP, we use a hybrid approach - RLS for auth users, client-side filtering for anonymous

-- First, alter the created_by column from UUID to TEXT to support anonymous IDs
-- This allows storing both authenticated user UUIDs (as text) and anonymous IDs (anon_xxx)
ALTER TABLE notes 
  ALTER COLUMN created_by TYPE TEXT 
  USING CASE 
    WHEN created_by IS NULL THEN NULL
    ELSE created_by::text
  END;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on notes" ON notes;
DROP POLICY IF EXISTS "Allow all operations on note_versions" ON note_versions;

-- Notes policies: 
-- Authenticated users can only access their own notes
-- Anonymous users can access notes (client-side filtering ensures they only see their own)
CREATE POLICY "Authenticated users access own notes" ON notes
  FOR ALL
  USING (
    -- If authenticated, only access own notes (cast UUID to text for comparison)
    (auth.uid() IS NOT NULL AND created_by = CAST(auth.uid() AS text))
    OR
    -- If not authenticated, allow access (client will filter by anonymous ID)
    (auth.uid() IS NULL)
  )
  WITH CHECK (
    -- Same conditions for inserts/updates
    (auth.uid() IS NOT NULL AND created_by = CAST(auth.uid() AS text))
    OR
    (auth.uid() IS NULL)
  );

-- Note versions: Users can access versions of notes they can access
CREATE POLICY "Users can access versions of accessible notes" ON note_versions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_versions.note_id
      AND (
        (auth.uid() IS NOT NULL AND notes.created_by = CAST(auth.uid() AS text))
        OR
        (auth.uid() IS NULL)
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM notes
      WHERE notes.id = note_versions.note_id
      AND (
        (auth.uid() IS NOT NULL AND notes.created_by = CAST(auth.uid() AS text))
        OR
        (auth.uid() IS NULL)
      )
    )
  );

-- Note: Client-side filtering in the notes store ensures anonymous users
-- only see notes created with their anonymous ID. RLS provides basic
-- security for authenticated users.
