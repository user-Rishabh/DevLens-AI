-- Migration: Create table for caching generated module-level documentation
-- Target: Supabase Postgres

CREATE TABLE IF NOT EXISTS module_docs (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    repo_id TEXT NOT NULL,
    module_path TEXT NOT NULL,
    doc_content TEXT NOT NULL,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT module_docs_repo_path_unique UNIQUE (repo_id, module_path)
);

-- Index cached lookups
CREATE INDEX IF NOT EXISTS idx_module_docs_repo_path ON module_docs (repo_id, module_path);
