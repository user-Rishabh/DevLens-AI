import os
import sys

# Add the parent directory of 'app' (i.e. 'backend') to sys.path to resolve package imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.routes import router as api_router

# Load environment variables from .env if present
load_dotenv()

app = FastAPI(
    title="DevLens AI API",
    description="Backend service for DevLens AI: codebase ingestion, dependency mapping, and analysis.",
    version="0.1.0"
)

# Register API Router
app.include_router(api_router, prefix="/api")

# CORS configuration
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000", # Common fallback port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """
    Basic health check endpoint to verify backend status.
    """
    try:
        from app.db import supabase
        from app.search.logger import log_debug
        log_debug("--- HEALTH CHECK DB DIAGNOSTICS ---")
        if supabase is None:
            log_debug("Supabase client is None")
        else:
            # Check code_chunks content_tsv and count
            res = supabase.table("code_chunks").select("id, repo_id, file_path, content_tsv").limit(5).execute()
            log_debug(f"First 5 code_chunks with content_tsv: {res.data}")
            
            res_count = supabase.table("code_chunks").select("id", count="exact").limit(1).execute()
            log_debug(f"Total code_chunks: {res_count.count}")
    except Exception as e:
        from app.search.logger import log_debug
        log_debug(f"Error in health check diagnostics: {str(e)}")
        import traceback
        log_debug(traceback.format_exc())
        
    return {"status": "ok"}



if __name__ == "__main__":
    import uvicorn
    # Use environment variables if specified, fallback to standard defaults
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "true").lower() == "true"
    
    uvicorn.run("main:app", host=host, port=port, reload=debug)
