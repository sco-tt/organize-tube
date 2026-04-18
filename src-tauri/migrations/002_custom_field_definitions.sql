-- Custom field definitions table for user-defined fields

CREATE TABLE custom_field_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  field_type TEXT NOT NULL, -- 'text', 'number', 'select', 'textarea'
  field_options TEXT, -- JSON array for select options
  default_value TEXT,
  is_required BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some default field definitions that users can modify/delete
INSERT INTO custom_field_definitions (id, name, display_name, field_type, sort_order) VALUES
('field_key', 'song_key', 'Key', 'text', 1),
('field_tempo', 'tempo', 'Tempo', 'number', 2),
('field_time_sig', 'time_signature', 'Time Signature', 'text', 3),
('field_notes', 'practice_notes', 'Practice Notes', 'textarea', 4);