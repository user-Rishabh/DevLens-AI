from app.db import supabase
from app.search.embeddings import embed_chunk

def vector_search(repo_id: str, query: str, top_k: int = 10) -> list[dict]:
    """
    Computes vector embeddings for the query text and executes a pgvector cosine 
    similarity search via PostgreSQL RPC, returning the top_k matching chunks.
    """
    if supabase is None:
        print("[DevLens AI Error] Supabase client offline. Cannot execute vector search.")
        return []
        
    try:
        query_vector = embed_chunk(query)
    except Exception as e:
        print(f"[DevLens AI Error] Query embedding generation failed: {str(e)}")
        return []
        
    try:
        response = supabase.rpc(
            "match_code_chunks",
            {
                "query_embedding": query_vector,
                "match_threshold": 0.0,  # Return all matching vectors capped by limits
                "match_count": top_k,
                "filter_repo_id": repo_id
            }
        ).execute()
        
        return response.data if response.data else []
    except Exception as e:
        print(f"[DevLens AI Error] Vector similarity RPC lookup failed: {str(e)}")
        return []
