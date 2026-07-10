import os
import re
import shutil
import subprocess
import tempfile
from fastapi import HTTPException

# Pattern to validate and extract owner and repo name from GitHub URL
GITHUB_URL_PATTERN = re.compile(
    r'^https?://(?:www\.)?github\.com/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_.-]+?)(?:\.git)?/?$'
)

def validate_github_url(url: str) -> tuple[str, str]:
    """
    Validates if a URL is a valid public GitHub URL.
    Returns (owner, repo_name) if valid, raises ValueError otherwise.
    """
    match = GITHUB_URL_PATTERN.match(url.strip())
    if not match:
        raise ValueError("Invalid GitHub repository URL. Format should be: https://github.com/owner/repo")
    return match.groups()

def clone_repo(github_url: str) -> str:
    """
    Shallow-clones a GitHub repository to a temporary directory.
    Enforces a 30-second timeout.
    Returns the path to the cloned repository.
    Raises HTTPException (400, 422, or 500) if validation or cloning fails.
    """
    try:
        owner, repo_name = validate_github_url(github_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Create a unique temporary directory
    temp_dir = tempfile.mkdtemp(prefix=f"devlens_{owner}_{repo_name}_")

    # Construct the git command for clone with history depth
    cmd = ["git", "clone", "--depth", "100", github_url.strip(), temp_dir]

    try:
        # Run clone with a 30-second timeout
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            check=True, 
            timeout=30
        )
        return temp_dir
        
    except subprocess.TimeoutExpired:
        # Clean up partial clones
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(
            status_code=422, 
            detail="Cloning timed out. The repository might be too large or the network is slow."
        )
        
    except subprocess.CalledProcessError as e:
        # Clean up on failure
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
            
        stderr_lower = e.stderr.lower()
        if "not found" in stderr_lower or "could not read from remote repository" in stderr_lower or "does not exist" in stderr_lower:
            raise HTTPException(
                status_code=422,
                detail="Repository not found or is private. Please ensure the repository is public and the URL is correct."
            )
        else:
            raise HTTPException(
                status_code=422,
                detail=f"Git clone failed: {e.stderr.strip()}"
            )
            
    except Exception as e:
        # Clean up on unexpected failure
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred during cloning: {str(e)}"
        )
