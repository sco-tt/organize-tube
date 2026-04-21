-- Add tags_json column for simplified tag storage
-- This provides a simpler alternative to the relational tags system
-- while maintaining compatibility with existing normalized tag tables

ALTER TABLE song_routines ADD COLUMN tags_json TEXT DEFAULT '[]';