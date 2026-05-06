-- Add MP3 upload support with single and multi-track capabilities

-- Add mp3_content_id column if it doesn't exist (for referencing MP3 content)
-- SQLite doesn't support IF NOT EXISTS for ADD COLUMN, so we use this pattern:
ALTER TABLE song_routines ADD COLUMN mp3_content_id TEXT DEFAULT NULL;

-- Store local audio file information
CREATE TABLE IF NOT EXISTS audio_files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  duration REAL NOT NULL,
  file_size INTEGER NOT NULL,
  file_format TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Group stems that belong together
CREATE TABLE IF NOT EXISTS stem_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  master_volume INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual tracks within a stem group or standalone
CREATE TABLE IF NOT EXISTS audio_tracks (
  id TEXT PRIMARY KEY,
  audio_file_id TEXT NOT NULL,
  stem_group_id TEXT,           -- NULL for single files
  track_name TEXT NOT NULL,     -- e.g., "Drums", "Guitar"
  track_type TEXT CHECK (track_type IN ('full', 'stem')) DEFAULT 'full',
  display_order INTEGER DEFAULT 0,
  is_muted BOOLEAN DEFAULT FALSE,
  volume INTEGER DEFAULT 100,
  pan_balance INTEGER DEFAULT 0,  -- -100 to +100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audio_file_id) REFERENCES audio_files(id) ON DELETE CASCADE,
  FOREIGN KEY (stem_group_id) REFERENCES stem_groups(id) ON DELETE CASCADE
);

-- Create indexes for performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_audio_tracks_audio_file ON audio_tracks(audio_file_id);
CREATE INDEX IF NOT EXISTS idx_audio_tracks_stem_group ON audio_tracks(stem_group_id);
CREATE INDEX IF NOT EXISTS idx_song_routines_mp3_content ON song_routines(mp3_content_id);
CREATE INDEX IF NOT EXISTS idx_audio_files_uploaded_at ON audio_files(uploaded_at);

-- Note: URL source enum change and URL nullable change will be done in a separate migration
-- when we actually implement the MP3 upload feature, to avoid breaking existing data