-- Migration: Create tables for file contents and cached AI summaries
-- Target: Supabase Postgres

-- 1. Create file_contents table to store raw file texts on-demand
CREATE TABLE IF NOT EXISTS file_contents (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repo_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT file_contents_repo_path_unique UNIQUE (repo_id, file_path)
);

-- Index relative path lookup speeds
CREATE INDEX IF NOT EXISTS idx_file_contents_repo_path ON file_contents (repo_id, file_path);

-- 2. Create file_summaries table to cache generated AI summaries
CREATE TABLE IF NOT EXISTS file_summaries (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repo_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    summary_text TEXT NOT NULL,
    model_used TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT file_summaries_repo_path_unique UNIQUE (repo_id, file_path)
);

-- Index cached lookups
CREATE INDEX IF NOT EXISTS idx_file_summaries_repo_path ON file_summaries (repo_id, file_path);
