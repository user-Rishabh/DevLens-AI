from app.db import supabase
from app.search.logger import log_debug

def keyword_search(repo_id: str, query: str, top_k: int = 10) -> list[dict]:
    """
    Executes a case-insensitive full-text keyword search in Python over chunks 
    fetched from the code_chunks table for a specific repository.
    """
    if supabase is None:
        log_debug("[DevLens AI Error] Supabase client offline. Cannot execute keyword search.")
        return []
        
    log_debug(f"[KEYWORD SEARCH] repo_id value: {repr(repo_id)}, type: {type(repo_id)}, query: {repr(query)}")
    try:
        # Fetch chunks for this repo
        response = supabase.table("code_chunks")\
            .select("id, repo_id, file_path, chunk_type, name, parent_class, start_line, end_line, content")\
            .eq("repo_id", repo_id)\
            .execute()
            
        chunks = response.data if response.data else []
        log_debug(f"[KEYWORD SEARCH PYTHON] Fetched {len(chunks)} chunks for repo_id: {repo_id}")
        
        query_lower = query.strip().lower()
        if not query_lower:
            return []
            
        scored_chunks = []
        for chunk in chunks:
            content_lower = chunk.get("content", "").lower()
            if not content_lower:
                continue
                
            rank_score = 0.0
            if query_lower in content_lower:
                # Exact phrase match gets high base score
                rank_score = 10.0 + content_lower.count(query_lower) * 0.5
            else:
                words = [w for w in query_lower.split() if len(w) > 1]
                if not words:
                    words = [w for w in query_lower.split() if w]
                if not words:
                    continue
                matches = sum(1 for w in words if w in content_lower)
                if matches == 0:
                    continue
                rank_score = (matches / len(words)) * 5.0 + sum(content_lower.count(w) for w in words) * 0.1
                
            chunk["rank_score"] = rank_score
            scored_chunks.append(chunk)
            
        scored_chunks.sort(key=lambda c: c["rank_score"], reverse=True)
        results = scored_chunks[:top_k]
        log_debug(f"[KEYWORD SEARCH SUCCESS] Returning {len(results)} results")
        return results
    except Exception as e:
        log_debug(f"[DevLens AI Error] Keyword similarity fallback lookup failed: {str(e)}")
        import traceback
        log_debug(traceback.format_exc())
        return []


