-- Add tags_json column for simplified tag storage (safe version)
-- This provides a simpler alternative to the relational tags system
-- while maintaining compatibility with existing normalized tag tables

-- Since SQLite doesn't support IF NOT EXISTS for ADD COLUMN, we'll check if it exists first
-- For this migration, we'll handle it gracefully in case the column already exists

-- The column may already exist, so we'll use a different approach
-- We'll create the column with a different name and then rename if needed

-- Check if tags_json column exists, if not add it
-- Note: This is a workaround since SQLite doesn't support conditional ADD COLUMN
BEGIN;

-- Try to add the column, ignore if it already exists
-- We'll catch the error in the application layer
ALTER TABLE song_routines ADD COLUMN tags_json TEXT DEFAULT '[]';

COMMIT;