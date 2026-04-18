-- Drop the name column from song_routines table
-- Since song names were often auto-generated from video IDs and not meaningful,
-- we're removing this redundant field and using only title from now on

ALTER TABLE song_routines DROP COLUMN name;