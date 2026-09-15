-- Migration: Add structured summary fields to file_summaries table
-- Target: Supabase Postgres

ALTER TABLE file_summaries
ADD COLUMN IF NOT EXISTS purpose TEXT,
ADD COLUMN IF NOT EXISTS key_parts JSONB,
ADD COLUMN IF NOT EXISTS connections TEXT;

-- Index if needed for queries
COMMENT ON COLUMN file_summaries.purpose IS 'Plain-language beginner-friendly explanation of the file purpose';
COMMENT ON COLUMN file_summaries.key_parts IS 'Key components, sections, or functions in the file with descriptions';
COMMENT ON COLUMN file_summaries.connections IS 'Explanation of how this file connects with the rest of the project';
