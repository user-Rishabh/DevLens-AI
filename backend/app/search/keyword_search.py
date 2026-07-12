from app.db import supabase

def keyword_search(repo_id: str, query: str, top_k: int = 10) -> list[dict]:
    """
    Executes PostgreSQL full-text search against GIN indexed content_tsv columns,
    returning top matching chunks filtered by repository.
    """
    if supabase is None:
        print("[DevLens AI Error] Supabase client offline. Cannot execute keyword search.")
        return []
        
    try:
        response = supabase.rpc(
            "match_code_chunks_keyword",
            {
                "query_text": query,
                "filter_repo_id": repo_id,
                "match_count": top_k
            }
        ).execute()
        
        return response.data if response.data else []
    except Exception as e:
        print(f"[DevLens AI Error] Keyword similarity RPC lookup failed: {str(e)}")
        return []
