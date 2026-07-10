import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.ingestion.clone import clone_repo, validate_github_url
from app.ingestion.filter import build_file_tree
from app.ingestion.cleanup import cleanup_repo

router = APIRouter()

class IngestRequest(BaseModel):
    github_url: str

class IngestResponse(BaseModel):
    repo_name: str
    file_tree: dict

@router.post("/repos/ingest", response_model=IngestResponse)
def ingest_repository(request: IngestRequest):
    """
    Ingests a public GitHub repository:
    1. Validates the URL
    2. Shallow clones to a temp folder (with timeout)
    3. Builds a filtered directory tree structure
    4. Cleans up the temp folder (guaranteed in finally block)
    5. Returns the repository name and nested file tree
    """
    github_url_str = request.github_url.strip()
    
    # 1. Pre-validate GitHub URL format to return a 400 immediately
    try:
        owner, repo_name = validate_github_url(github_url_str)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    local_path = None
    try:
        # 2. Clone repository (raises 422 or 500 on failure)
        local_path = clone_repo(github_url_str)
        
        # 3. Build the file tree structure
        file_tree = build_file_tree(local_path)
        
        if not file_tree or not file_tree.get("children"):
            # Empty tree or parsing failure
            raise HTTPException(
                status_code=500,
                detail="Failed to parse repository structure. The repository might be empty or restricted."
            )
            
        return IngestResponse(
            repo_name=repo_name,
            file_tree=file_tree
        )
        
    finally:
        # 4. Guarantee cleanup of cloned directory
        if local_path and os.path.exists(local_path):
            cleanup_repo(local_path)
