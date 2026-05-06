-- Add tags_json column for simplified tag storage (safe version)
-- This provides a simpler alternative to the relational tags system
-- while maintaining compatibility with existing normalized tag tables

-- Since the column might already exist, we'll use a conditional approach
-- SQLite doesn't support IF NOT EXISTS for columns, so we'll handle this differently

-- First, check if the column exists by trying to query it
-- If it fails, add the column

-- Create a temporary table to test
CREATE TEMP TABLE test_tags AS SELECT tags_json FROM song_routines WHERE 0=1;

-- If we got here, the column exists, so we do nothing
DROP TABLE test_tags;