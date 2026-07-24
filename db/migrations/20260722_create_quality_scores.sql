-- Migration: Create quality_scores table
-- Target: Supabase Postgres

CREATE TABLE IF NOT EXISTS quality_scores (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repo_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    churn_score INT NOT NULL,
    size_score INT NOT NULL,
    complexity_score INT NOT NULL,
    composite_score INT NOT NULL,
    computed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT quality_scores_repo_file_unique UNIQUE (repo_id, file_path)
);

CREATE INDEX IF NOT EXISTS idx_quality_scores_repo_id ON quality_scores (repo_id);
