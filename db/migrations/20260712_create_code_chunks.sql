-- 1. Enable the pgvector extension to work with vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create code_chunks table
CREATE TABLE IF NOT EXISTS code_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    repo_id TEXT NOT NULL,
    file_path TEXT NOT NULL,
    chunk_type TEXT NOT NULL,
    name TEXT NOT NULL,
    parent_class TEXT,
    start_line INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(384) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create HNSW index for fast similarity search using cosine distance
-- HNSW is highly performant and the standard vector index for pgvector >= 0.5.0
CREATE INDEX IF NOT EXISTS idx_code_chunks_embedding_hnsw 
ON code_chunks USING hnsw (embedding vector_cosine_ops);

-- 4. Create metadata indexes for scoping query results
CREATE INDEX IF NOT EXISTS idx_code_chunks_repo_id ON code_chunks (repo_id);
CREATE INDEX IF NOT EXISTS idx_code_chunks_file_path ON code_chunks (file_path);

-- 5. Create database RPC function for semantic similarity searches
-- Supabase client doesn't support vector calculations directly in selects,
-- so we expose a database function called via client.rpc()
CREATE OR REPLACE FUNCTION match_code_chunks (
  query_embedding vector(384),
  match_threshold float,
  match_count int,
  filter_repo_id text
)
RETURNS TABLE (
  id uuid,
  repo_id text,
  file_path text,
  chunk_type text,
  name text,
  parent_class text,
  start_line int,
  end_line int,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    code_chunks.id,
    code_chunks.repo_id,
    code_chunks.file_path,
    code_chunks.chunk_type,
    code_chunks.name,
    code_chunks.parent_class,
    code_chunks.start_line,
    code_chunks.end_line,
    code_chunks.content,
    -- Cosine similarity is computed as 1 - cosine distance (which is <=> operator)
    1 - (code_chunks.embedding <=> query_embedding) AS similarity
  FROM code_chunks
  WHERE code_chunks.repo_id = filter_repo_id
    AND 1 - (code_chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY code_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
