import os
import re
import shutil
import subprocess
import tempfile
import urllib.request
import json
import zipfile
import io
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

def get_github_repo_size(owner: str, repo_name: str) -> int | None:
    """
    Queries GitHub API to get repository size in KB.
    Returns size in KB or None if query fails.
    """
    url = f"https://api.github.com/repos/{owner}/{repo_name}"
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "DevLens-AI-Cloner"}
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            return data.get("size")
    except Exception as e:
        print(f"[DevLens AI Warning] Failed to query GitHub repository size info: {str(e)}")
        return None

def download_repo_zip(owner: str, repo_name: str, temp_dir: str) -> str:
    """
    Downloads the repository zipball from GitHub and extracts it to temp_dir.
    """
    urls = [
        f"https://api.github.com/repos/{owner}/{repo_name}/zipball",
        f"https://github.com/{owner}/{repo_name}/archive/refs/heads/main.zip",
        f"https://github.com/{owner}/{repo_name}/archive/refs/heads/master.zip"
    ]
    
    last_error = None
    for url in urls:
        print(f"[DevLens AI] Attempting to download ZIP from: {url}")
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "DevLens-AI-Cloner"}
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as response:
                zip_data = response.read()
                
            with zipfile.ZipFile(io.BytesIO(zip_data)) as zip_ref:
                extract_dir = tempfile.mkdtemp(prefix="zip_extract_")
                try:
                    zip_ref.extractall(extract_dir)
                    
                    subdirs = [d for d in os.listdir(extract_dir) if os.path.isdir(os.path.join(extract_dir, d))]
                    if subdirs:
                        root_subdir = os.path.join(extract_dir, subdirs[0])
                        for item in os.listdir(root_subdir):
                            s = os.path.join(root_subdir, item)
                            d = os.path.join(temp_dir, item)
                            if os.path.isdir(s):
                                shutil.copytree(s, d, symlinks=True)
                            else:
                                shutil.copy2(s, d)
                    else:
                        for item in os.listdir(extract_dir):
                            s = os.path.join(extract_dir, item)
                            d = os.path.join(temp_dir, item)
                            if os.path.isdir(s):
                                shutil.copytree(s, d, symlinks=True)
                            else:
                                shutil.copy2(s, d)
                finally:
                    shutil.rmtree(extract_dir, ignore_errors=True)
                    
            print(f"[DevLens AI] Successfully downloaded and extracted ZIP to {temp_dir}")
            return temp_dir
            
        except Exception as e:
            print(f"[DevLens AI Warning] Failed to download/extract from {url}: {str(e)}")
            last_error = e
            
    raise Exception(f"All ZIP fallback URLs failed. Last error: {str(last_error)}")

def clone_repo(github_url: str) -> str:
    """
    Clones a GitHub repository to a temporary directory with a configurable history depth.
    Enforces a 120-second timeout. Fallback to downloading a ZIP file if git is not available.
    Returns the path to the cloned repository.
    Raises HTTPException (400, 422, or 500) if validation or cloning fails.
    """
    try:
        owner, repo_name = validate_github_url(github_url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Fetch and log repository size if available
    repo_size_kb = get_github_repo_size(owner, repo_name)
    if repo_size_kb is not None:
        print(f"[DevLens AI] Repository size of {owner}/{repo_name} fetched: {repo_size_kb / 1024:.2f} MB ({repo_size_kb} KB)")
    else:
        print(f"[DevLens AI] Repository size of {owner}/{repo_name} fetched: Unknown")

    # Get CLONE_DEPTH from environment variables with fallback to 100
    clone_depth_str = os.getenv("CLONE_DEPTH", "100")
    try:
        clone_depth = int(clone_depth_str)
    except ValueError:
        clone_depth = 100

    # Create a unique temporary directory
    temp_dir = tempfile.mkdtemp(prefix=f"devlens_{owner}_{repo_name}_")

    # Construct the git command for clone with history depth
    cmd = ["git", "clone", "--depth", str(clone_depth), github_url.strip(), temp_dir]

    try:
        # Run clone with a 120-second timeout
        result = subprocess.run(
            cmd, 
            capture_output=True, 
            text=True, 
            check=True, 
            timeout=120
        )
        return temp_dir
        
    except FileNotFoundError:
        print("[DevLens AI] 'git' command not found. Falling back to downloading ZIP from GitHub...")
        try:
            return download_repo_zip(owner, repo_name, temp_dir)
        except Exception as zip_err:
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir, ignore_errors=True)
            raise HTTPException(
                status_code=500,
                detail=f"Git is not installed on the system, and ZIP download fallback failed: {str(zip_err)}"
            )
        
    except subprocess.TimeoutExpired:
        # Clean up partial clones
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir, ignore_errors=True)
        raise HTTPException(
            status_code=422, 
            detail="Cloning timed out after 120s. This may be due to a large repository or slow network — try again, or try a smaller repository."
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

