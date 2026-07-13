import json
from app.db import supabase
from app.search.embeddings import embed_chunk
from app.search.logger import log_debug

def dot_product(v1, v2):
    return sum(x * y for x, y in zip(v1, v2))

def vector_search(repo_id: str, query: str, top_k: int = 10) -> list[dict]:
    """
    Computes vector embeddings for the query text and executes a cosine 
    similarity search in Python over chunks fetched from the code_chunks table.
    """
    if supabase is None:
        log_debug("[DevLens AI Error] Supabase client offline. Cannot execute vector search.")
        return []
        
    try:
        query_vector = embed_chunk(query)
    except Exception as e:
        log_debug(f"[DevLens AI Error] Query embedding generation failed: {str(e)}")
        return []
        
    log_debug(f"[VECTOR SEARCH] repo_id value: {repr(repo_id)}, type: {type(repo_id)}, query: {repr(query)}")
    try:
        # Fetch chunks for this repo
        response = supabase.table("code_chunks")\
            .select("id, repo_id, file_path, chunk_type, name, parent_class, start_line, end_line, content, embedding")\
            .eq("repo_id", repo_id)\
            .execute()
            
        chunks = response.data if response.data else []
        log_debug(f"[VECTOR SEARCH PYTHON] Fetched {len(chunks)} chunks for repo_id: {repo_id}")
        
        scored_chunks = []
        for chunk in chunks:
            emb = chunk.get("embedding")
            if not emb:
                continue
            if isinstance(emb, str):
                try:
                    emb = json.loads(emb)
                except Exception:
                    continue
            if not isinstance(emb, list):
                continue
                
            similarity = dot_product(query_vector, emb)
            chunk["similarity"] = similarity
            scored_chunks.append(chunk)
            
        scored_chunks.sort(key=lambda c: c["similarity"], reverse=True)
        results = scored_chunks[:top_k]
        log_debug(f"[VECTOR SEARCH SUCCESS] Returning {len(results)} results")
        return results
    except Exception as e:
        log_debug(f"[DevLens AI Error] Vector similarity fallback lookup failed: {str(e)}")
        import traceback
        log_debug(traceback.format_exc())
        return []


