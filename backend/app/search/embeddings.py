import os

# Thread-safe lazy-loaded model instance
_model_instance = None

def get_model():
    """
    Lazy-loads the sentence-transformers model upon first request to prevent server 
    startup delays, excessive memory usage at startup, or crash states.
    
    CRITICAL MEMORY OPTIMIZATION FOR 512MB RAM HOSTING (Render Free Tier):
    We do NOT import SentenceTransformer at the module level. Deferring the import
    prevents PyTorch, Hugging Face Transformers, and associated heavy C++ DLLs 
    from loading at module import time, reducing idle server RAM by ~150-250MB.
    
    If memory remains tight during active embedding despite lazy loading:
    Consider swapping to a smaller model variant like 'prajjwal1/bert-tiny' (approx 17MB)
    or 'paraphrase-MiniLM-L3-v2' (approx 45MB) instead of 'all-MiniLM-L6-v2' (approx 90MB).
    """
    global _model_instance
    if _model_instance is not None:
        return _model_instance
        
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError as e:
        print(f"[DevLens AI Error] Failed to import sentence_transformers: {str(e)}")
        raise ImportError(
            "The 'sentence-transformers' package is not installed or failed to load. "
            "Run 'pip install -r requirements.txt' to install."
        ) from e

    print("[DevLens AI] Loading SentenceTransformer 'all-MiniLM-L6-v2' (approx. 90MB local model)...")
    # Load local model. Runs on CPU automatically if CUDA is not configured
    _model_instance = SentenceTransformer("all-MiniLM-L6-v2")
    print("[DevLens AI] SentenceTransformer model loaded successfully.")
    return _model_instance

def embed_chunk(content: str) -> list[float]:
    """
    Computes a 384-dimensional vector embedding for the given text.
    """
    model = get_model()
    if not model:
        raise ImportError(
            "The 'sentence-transformers' package is not installed or failed to load. "
            "Run 'pip install -r requirements.txt' to install."
        )
    embedding = model.encode(content, convert_to_numpy=True)
    return embedding.tolist()

def embed_chunks_batch(chunks: list[dict]) -> list[dict]:
    """
    Computes vector embeddings for a list of chunk dicts in batch for high performance.
    Appends the "embedding" key containing a float list of size 384 to each chunk.
    """
    if not chunks:
        return []
        
    model = get_model()
    if not model:
        raise ImportError(
            "The 'sentence-transformers' package is not installed or failed to load. "
            "Run 'pip install -r requirements.txt' to install."
        )
        
    # Extract raw content strings
    texts = [chunk.get("content", "") for chunk in chunks]
    
    # Encode all texts concurrently
    embeddings = model.encode(texts, convert_to_numpy=True, show_progress_bar=False)
    
    # Assign float lists back to corresponding chunk dicts
    for i, embedding in enumerate(embeddings):
        chunks[i]["embedding"] = embedding.tolist()
        
    return chunks
