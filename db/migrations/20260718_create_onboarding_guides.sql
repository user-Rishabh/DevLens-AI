-- Migration: Create tables for repo analysis cache and onboarding guides
-- Target: Supabase Postgres

-- 1. Create repo_analyses table to store tree, dependencies, and hotspots
CREATE TABLE IF NOT EXISTS repo_analyses (
    repo_id TEXT PRIMARY KEY,
    file_tree JSONB NOT NULL,
    dependencies JSONB DEFAULT '[]'::jsonb,
    hotspots JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure dependencies and hotspots columns exist if repo_analyses table was created previously without them
ALTER TABLE repo_analyses ADD COLUMN IF NOT EXISTS dependencies JSONB DEFAULT '[]'::jsonb;
ALTER TABLE repo_analyses ADD COLUMN IF NOT EXISTS hotspots JSONB DEFAULT '[]'::jsonb;

-- 2. Create onboarding_guides table to cache generated onboarding guides
CREATE TABLE IF NOT EXISTS onboarding_guides (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repo_id TEXT NOT NULL,
    guide_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT onboarding_guides_repo_id_unique UNIQUE (repo_id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_guides_repo_id ON onboarding_guides (repo_id);
