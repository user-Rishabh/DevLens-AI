-- 1. Add content_tsv generated column for full-text search
-- We use 'simple' configuration because standard 'english' stemming would stem code terms, 
-- e.g. converting 'directories' to 'directori' or 'files' to 'file', which breaks exact matches on code identifiers.
ALTER TABLE code_chunks 
ADD COLUMN IF NOT EXISTS content_tsv tsvector 
GENERATED ALWAYS AS (to_tsvector('simple', content)) STORED;

-- 2. Create GIN index on the generated TSVector column for high performance queries
CREATE INDEX IF NOT EXISTS idx_code_chunks_content_tsv 
ON code_chunks USING gin (content_tsv);

-- 3. Create database RPC function for ranked keyword lookups
-- Uses websearch_to_tsquery for simple search parsing (supporting quotes for exact phrases and AND/OR operators)
CREATE OR REPLACE FUNCTION match_code_chunks_keyword (
  query_text text,
  filter_repo_id text,
  match_count int
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
  rank_score float
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
    -- ts_rank calculates the relevance score of the text search query against the tsvector column
    ts_rank(code_chunks.content_tsv, websearch_to_tsquery('simple', query_text))::float AS rank_score
  FROM code_chunks
  WHERE code_chunks.repo_id = filter_repo_id
    AND code_chunks.content_tsv @@ websearch_to_tsquery('simple', query_text)
  ORDER BY rank_score DESC, code_chunks.file_path ASC
  LIMIT match_count;
END;
$$;
