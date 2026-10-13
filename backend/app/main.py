import os
import sys

# Add the parent directory of 'app' (i.e. 'backend') to sys.path to resolve package imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.api.routes import router as api_router

# Load environment variables from .env if present (with override)
load_dotenv(override=True)

app = FastAPI(
    title="DevLens AI API",
    description="Backend service for DevLens AI: codebase ingestion, dependency mapping, and analysis.",
    version="0.1.0"
)

# CORS configuration — must be added BEFORE routers are included
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000", # Common fallback port
]

frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    origins.append(frontend_url)

# Match Vercel subdomains (previews and production aliases starting with dev-lens-)
origins_regex = r"https?://dev-lens-.*\.vercel\.app"

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origins_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix="/api")

@app.get("/api/health")
async def health_check():
    """
    Basic health check endpoint to verify backend status.
    """
    return {"status": "ok"}



if __name__ == "__main__":
    import uvicorn
    # Use environment variables if specified, fallback to standard defaults
    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "true").lower() == "true"
    
    uvicorn.run("main:app", host=host, port=port, reload=debug)
