import os

try:
    from sentence_transformers import SentenceTransformer
    HAS_EMBEDDING_SDK = True
except ImportError:
    HAS_EMBEDDING_SDK = False

# Thread-safe lazy-loaded model instance
_model_instance = None

def get_model():
    """
    Lazy-loads the sentence-transformers model upon first request to prevent server 
    startup delays or crash states if dependencies are currently installing.
    """
    global _model_instance
    if not HAS_EMBEDDING_SDK:
        return None
    if _model_instance is None:
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
