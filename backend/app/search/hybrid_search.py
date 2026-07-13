from app.search.keyword_search import keyword_search
from app.search.vector_search import vector_search
from app.search.logger import log_debug

def hybrid_search(repo_id: str, query: str, top_k: int = 10) -> list[dict]:
    """
    Executes a hybrid search query by combining exact GIN-indexed keyword search 
    and pgvector semantic similarity search using Reciprocal Rank Fusion (RRF).
    """
    # Query more candidates than requested to ensure RRF has overlapping items
    candidate_limit = max(top_k * 3, 30)
    
    # 1. Fetch search results from both streams
    vector_results = vector_search(repo_id, query, top_k=candidate_limit)
    keyword_results = keyword_search(repo_id, query, top_k=candidate_limit)
    
    log_debug(f"[HYBRID SEARCH] repo_id: {repr(repo_id)}, query: {repr(query)}")
    log_debug(f"  Vector results raw count: {len(vector_results)}")
    log_debug(f"  Keyword results raw count: {len(keyword_results)}")

    
    # 2. Merge and compute RRF scores
    # Score = sum( 1 / (k + rank) ) where k=60 is a standard default constant
    k = 60.0
    rrf_scores = {}
    chunk_map = {}
    found_by = {}
    
    # Score vector results
    for rank, chunk in enumerate(vector_results, start=1):
        chunk_id = chunk["id"]
        chunk_map[chunk_id] = chunk
        found_by.setdefault(chunk_id, set()).add("vector")
        rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + (1.0 / (k + rank))
        
    # Score keyword results
    for rank, chunk in enumerate(keyword_results, start=1):
        chunk_id = chunk["id"]
        chunk_map[chunk_id] = chunk
        found_by.setdefault(chunk_id, set()).add("keyword")
        rrf_scores[chunk_id] = rrf_scores.get(chunk_id, 0.0) + (1.0 / (k + rank))
        
    # 3. Sort items descending by combined RRF score
    sorted_ids = sorted(rrf_scores.keys(), key=lambda cid: rrf_scores[cid], reverse=True)
    
    # 4. Formulate the final ranked subset response
    hybrid_results = []
    for cid in sorted_ids[:top_k]:
        chunk = chunk_map[cid]
        
        # Create a clean preview of content text (first ~200 characters)
        preview_length = 200
        content = chunk["content"]
        content_preview = content[:preview_length]
        if len(content) > preview_length:
            content_preview += "..."
            
        hybrid_results.append({
            "id": chunk["id"],
            "repo_id": chunk["repo_id"],
            "file_path": chunk["file_path"],
            "chunk_type": chunk["chunk_type"],
            "name": chunk["name"],
            "parent_class": chunk.get("parent_class"),
            "start_line": chunk["start_line"],
            "end_line": chunk["end_line"],
            "content_preview": content_preview,
            "content": content,
            "found_by": list(found_by[cid]),
            "rrf_score": rrf_scores[cid]
        })
        
    return hybrid_results
