-- Simplify schema for MP3 support: nullable URL and simple enum
-- This implements the cleaner approach: 'youtube' | 'mp3' enum and nullable URL

-- SQLite doesn't support modifying column constraints directly,
-- so we need to recreate the table with the new schema

-- Step 1: Create new table with the desired schema
CREATE TABLE song_routines_new (
  id TEXT PRIMARY KEY,
  url TEXT NULL,  -- Now nullable for MP3 files
  url_source TEXT CHECK (url_source IN ('youtube', 'mp3')) NOT NULL DEFAULT 'youtube',  -- Simple enum
  title TEXT,
  artist TEXT,
  duration INTEGER, -- seconds
  notes TEXT,
  freeform_notes TEXT,
  volume INTEGER DEFAULT 100, -- 0-100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_practiced TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  tags_json TEXT DEFAULT '[]',
  mp3_content_id TEXT DEFAULT NULL
);

-- Step 2: Copy all existing data (all existing records are YouTube with non-null URLs)
INSERT INTO song_routines_new (
  id, url, url_source, title, artist, duration, notes, freeform_notes,
  volume, created_at, last_practiced, updated_at, tags_json, mp3_content_id
)
SELECT
  id, url, 'youtube', title, artist, duration, notes, freeform_notes,
  volume, created_at, last_practiced, updated_at, tags_json, mp3_content_id
FROM song_routines;

-- Step 3: Drop old table
DROP TABLE song_routines;

-- Step 4: Rename new table
ALTER TABLE song_routines_new RENAME TO song_routines;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_song_routines_created_at ON song_routines(created_at);
CREATE INDEX IF NOT EXISTS idx_song_routines_last_practiced ON song_routines(last_practiced);
CREATE INDEX IF NOT EXISTS idx_song_routines_url ON song_routines(url);
CREATE INDEX IF NOT EXISTS idx_song_routines_mp3_content ON song_routines(mp3_content_id);

-- Step 6: Recreate foreign key constraints for other tables
-- (SQLite will automatically handle this for existing foreign keys)