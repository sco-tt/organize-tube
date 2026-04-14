-- Initial schema for Segment Studio

-- Song Routines (main entity)
CREATE TABLE song_routines (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  url_source TEXT NOT NULL DEFAULT 'youtube',
  title TEXT,
  artist TEXT,
  duration INTEGER, -- seconds
  name TEXT,
  notes TEXT,
  freeform_notes TEXT,
  volume INTEGER DEFAULT 100, -- 0-100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_practiced TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Loop Segments (belongs to song_routine or standalone)
CREATE TABLE loop_segments (
  id TEXT PRIMARY KEY,
  song_routine_id TEXT NULL, -- NULL for standalone segments
  name TEXT NOT NULL,
  start_time REAL NOT NULL, -- seconds with decimals
  end_time REAL NOT NULL,
  default_speed REAL DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  order_index INTEGER DEFAULT 0,
  FOREIGN KEY (song_routine_id) REFERENCES song_routines(id) ON DELETE CASCADE
);

-- Tags (many-to-many with songs)
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  color TEXT DEFAULT '#007bff'
);

CREATE TABLE song_routine_tags (
  song_routine_id TEXT,
  tag_id INTEGER,
  PRIMARY KEY (song_routine_id, tag_id),
  FOREIGN KEY (song_routine_id) REFERENCES song_routines(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Practice Steps (ordered steps within a routine)
CREATE TABLE practice_steps (
  id TEXT PRIMARY KEY,
  song_routine_id TEXT NOT NULL,
  loop_segment_id TEXT NULL, -- NULL means full song
  speed REAL NOT NULL,
  repetitions INTEGER NULL, -- NULL means infinite
  order_index INTEGER NOT NULL,
  FOREIGN KEY (song_routine_id) REFERENCES song_routines(id) ON DELETE CASCADE,
  FOREIGN KEY (loop_segment_id) REFERENCES loop_segments(id) ON DELETE CASCADE
);

-- Set Lists
CREATE TABLE set_lists (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  estimated_duration INTEGER -- seconds
);

CREATE TABLE set_list_items (
  id TEXT PRIMARY KEY,
  set_list_id TEXT NOT NULL,
  song_routine_id TEXT NOT NULL,
  play_mode TEXT NOT NULL DEFAULT 'routine', -- 'routine' or 'single'
  order_index INTEGER NOT NULL,
  FOREIGN KEY (set_list_id) REFERENCES set_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (song_routine_id) REFERENCES song_routines(id) ON DELETE CASCADE
);

-- Resource Links (attached to songs)
CREATE TABLE resource_links (
  id TEXT PRIMARY KEY,
  song_routine_id TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  link_type TEXT DEFAULT 'general', -- 'tabs', 'tutorial', 'backing_track', etc.
  FOREIGN KEY (song_routine_id) REFERENCES song_routines(id) ON DELETE CASCADE
);

-- App Settings
CREATE TABLE app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_loop_segments_song_routine ON loop_segments(song_routine_id);
CREATE INDEX idx_practice_steps_song_routine ON practice_steps(song_routine_id);
CREATE INDEX idx_set_list_items_set_list ON set_list_items(set_list_id);
CREATE INDEX idx_song_routines_created_at ON song_routines(created_at);
CREATE INDEX idx_song_routines_last_practiced ON song_routines(last_practiced);
CREATE INDEX idx_song_routines_url ON song_routines(url);

-- Insert default tags
INSERT INTO tags (name, color) VALUES
('Practice', '#28a745'),
('Favorite', '#ffc107'),
('Difficult', '#dc3545'),
('Learning', '#007bff'),
('Complete', '#6c757d');