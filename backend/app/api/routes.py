import os
import hashlib
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.ingestion.clone import clone_repo, validate_github_url
from app.ingestion.filter import build_file_tree
from app.ingestion.cleanup import cleanup_repo
from app.analysis.dependency_graph import extract_dependencies, get_all_project_files
from app.analysis.git_hotspots import get_hotspots
from app.db import supabase, save_file_contents, save_repo_analysis
from app.llm.summarizer import summarize_file
from app.llm.rag_answer import generate_rag_answer
from app.search.chunker import process_repo_chunks, index_repo, is_excluded_file
from app.search.embeddings import embed_chunk
from app.search.hybrid_search import hybrid_search

router = APIRouter()

class IngestRequest(BaseModel):
    github_url: str

class SearchRequest(BaseModel):
    query: str
    top_k: int = 10

class IngestResponse(BaseModel):
    repo_id: str
    repo_name: str
    file_tree: dict
    dependencies: list[dict]
    hotspots: list[dict]

class ExplainResponse(BaseModel):
    summary: str
    model_used: str
    cached: bool

@router.post("/repos/ingest", response_model=IngestResponse)
def ingest_repository(request: IngestRequest):
    """
    Ingests a public GitHub repository:
    1. Validates the URL
    2. Generates a unique, stable repo_id (based on URL hash)
    3. Clones to a temp folder (with timeout and history depth)
    4. Builds a filtered directory tree structure
    5. Extracts file dependencies and Git hotspots
    6. Saves raw file contents to database (before directory cleanup)
    7. Cleans up the temp folder (guaranteed in finally block)
    8. Returns the repo_id, repository name, file tree, dependencies, and hotspots
    """
    github_url_str = request.github_url.strip()
    
    # 1. Pre-validate GitHub URL format to return a 400 immediately
    try:
        owner, repo_name = validate_github_url(github_url_str)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
        
    # 2. Generate a stable unique repo_id from the repository URL
    repo_id = hashlib.sha256(github_url_str.encode("utf-8")).hexdigest()[:16]
        
    local_path = None
    try:
        # 3. Clone repository (raises 422 or 500 on failure)
        local_path = clone_repo(github_url_str)
        
        # 4. Build the file tree structure
        file_tree = build_file_tree(local_path)
        
        if not file_tree or not file_tree.get("children"):
            raise HTTPException(
                status_code=500,
                detail="Failed to parse repository structure. The repository might be empty or restricted."
            )
            
        # 5. Perform code analysis (dependencies & git hotspots)
        dependencies = extract_dependencies(local_path, file_tree)
        hotspots = get_hotspots(local_path)
        
        project_files = get_all_project_files(file_tree)
        save_file_contents(repo_id, local_path, project_files)
        save_repo_analysis(repo_id, file_tree, dependencies, hotspots)
            
        return IngestResponse(
            repo_id=repo_id,
            repo_name=repo_name,
            file_tree=file_tree,
            dependencies=dependencies,
            hotspots=hotspots
        )
        
    finally:
        # 7. Guarantee cleanup of cloned directory
        if local_path and os.path.exists(local_path):
            cleanup_repo(local_path)

@router.get("/files/explain", response_model=ExplainResponse)
def explain_file(
    repo_id: str = Query(..., description="Unique repository identifier"),
    file_path: str = Query(..., description="Relative file path within the repository")
):
    """
    Retrieves or generates an AI explanation/summary for a given file:
    1. Checks if the file is excluded (lockfiles, minified files, or files > 200KB).
    2. Checks the cache (file_summaries table). If present, returns immediately.
    3. If missing, retrieves the raw file content from file_contents table.
    4. Triggers the AI summarization via OpenRouter.
    5. Saves the summary to file_summaries and returns it.
    """
    model_name = "llama-3.3-70b-versatile"

    # Fast-path check: exclude by file name/pattern before DB or LLM call
    if is_excluded_file(file_path, None):
        return ExplainResponse(
            summary="AI explanation is skipped for lockfiles, minified files, or files larger than 200KB.",
            model_used="skipped",
            cached=False
        )

    # If Supabase is offline/unconfigured, return a mock summary for local-only developers
    if supabase is None:
        return ExplainResponse(
            summary=(
                f"This is a fallback description for `{file_path}`. "
                "Supabase is not configured (SUPABASE_URL and SUPABASE_KEY are missing). "
                "Set these variables in your environment to enable live AI summaries and database caching."
            ),
            model_used="mock-model",
            cached=False
        )

    # 1. Check cache first
    try:
        cache_check = supabase.table("file_summaries")\
            .select("summary_text, model_used")\
            .eq("repo_id", repo_id)\
            .eq("file_path", file_path)\
            .execute()
        
        if cache_check.data and len(cache_check.data) > 0:
            cached_data = cache_check.data[0]
            return ExplainResponse(
                summary=cached_data["summary_text"],
                model_used=cached_data["model_used"],
                cached=True
            )
    except Exception as e:
        print(f"[DevLens AI Database Error] Failed to query file_summaries cache: {str(e)}")
        # Proceed to fetch and overwrite/generate in case database has issues

    # 2. Retrieve raw file content from database
    try:
        content_query = supabase.table("file_contents")\
            .select("content")\
            .eq("repo_id", repo_id)\
            .eq("file_path", file_path)\
            .execute()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database query failed when fetching file content: {str(e)}"
        )

    if not content_query.data or len(content_query.data) == 0:
        raise HTTPException(
            status_code=404,
            detail=f"File content not found for '{file_path}' in repository ID: {repo_id}. Verify the path is correct and exists."
        )

    raw_content = content_query.data[0]["content"]

    # Slow-path check: exclude by content size (> 200KB)
    if is_excluded_file(file_path, raw_content):
        return ExplainResponse(
            summary="AI explanation is skipped for lockfiles, minified files, or files larger than 200KB.",
            model_used="skipped",
            cached=False
        )

    # 3. Generate explanation using OpenRouter LLM
    summary_text = summarize_file(file_path, raw_content)

    # 4. Cache the explanation in the database
    try:
        summary_record = {
            "repo_id": repo_id,
            "file_path": file_path,
            "summary_text": summary_text,
            "model_used": model_name
        }
        supabase.table("file_summaries").upsert(summary_record).execute()
    except Exception as e:
        # Log error but return the summary since it was generated successfully
        print(f"[DevLens AI Database Error] Failed to cache generated summary: {str(e)}")

    return ExplainResponse(
        summary=summary_text,
        model_used=model_name,
        cached=False
    )

@router.get("/repos/{repo_id}/chunks-preview")
def get_chunks_preview(repo_id: str):
    """
    Runs AST code chunking on all ingested files for the given repository and returns a preview.
    """
    chunks = process_repo_chunks(repo_id)
    if not chunks:
        raise HTTPException(
            status_code=404,
            detail=f"No chunks found for repository: {repo_id}. Ensure it has been ingested first."
        )
    return chunks

@router.post("/repos/{repo_id}/index")
def trigger_repository_index(repo_id: str, force_reindex: bool = Query(False, description="Forces re-extraction and re-embedding of codebase chunks")):
    """
    Triggers code chunking, vector embedding calculations, and database indexing.
    NOTE: In production environments with large repos, this should be executed as an asynchronous background task.
    """
    try:
        summary = index_repo(repo_id, force_reindex=force_reindex)
        return summary
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Repository indexing failed: {str(e)}"
        )

@router.delete("/repos/{repo_id}/chunks/cleanup-noise")
def cleanup_noise_chunks(repo_id: str):
    """
    Deletes existing rows from code_chunks where file_path matches any of the
    excluded patterns (lockfiles, minified files, or files >200KB), for the given repo_id.
    Returns a count of how many rows were deleted.
    """
    if supabase is None:
        raise HTTPException(
            status_code=500,
            detail="Supabase database integration is not configured."
        )

    try:
        # 1. Fetch all unique file paths currently indexed in code_chunks for this repo
        chunks_res = supabase.table("code_chunks")\
            .select("file_path")\
            .eq("repo_id", repo_id)\
            .execute()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to query code_chunks from database: {str(e)}"
        )

    if not chunks_res.data:
        return {"repo_id": repo_id, "deleted_count": 0}

    unique_paths = {row["file_path"] for row in chunks_res.data}

    # 2. Query all file contents for this repo to get their size
    try:
        contents_res = supabase.table("file_contents")\
            .select("file_path, content")\
            .eq("repo_id", repo_id)\
            .execute()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to query file contents from database: {str(e)}"
        )

    path_to_size = {}
    if contents_res.data:
        for row in contents_res.data:
            path_to_size[row["file_path"]] = len(row["content"].encode("utf-8")) if row["content"] else 0

    # 3. Filter paths that match any of the exclusion criteria
    excluded_paths = set()
    for path in unique_paths:
        if is_excluded_file(path, None):
            excluded_paths.add(path)
            continue
            
        # Get content size if available
        size = path_to_size.get(path, 0)
        # Check if size > 200KB
        if size > 200 * 1024:
            excluded_paths.add(path)

    deleted_count = 0
    if excluded_paths:
        excluded_paths_list = list(excluded_paths)
        # Delete matching chunks
        try:
            for file_path in excluded_paths_list:
                del_res = supabase.table("code_chunks")\
                    .delete()\
                    .eq("repo_id", repo_id)\
                    .eq("file_path", file_path)\
                    .execute()
                if del_res.data:
                    deleted_count += len(del_res.data)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete code chunks for file paths: {str(e)}"
            )

    return {
        "repo_id": repo_id,
        "deleted_count": deleted_count,
        "excluded_files_purged": list(excluded_paths)
    }

@router.get("/repos/{repo_id}/similar-chunks")
def get_similar_chunks(repo_id: str, query: str = Query(..., description="Semantic query text"), limit: int = Query(5, description="Number of results to retrieve")):
    """
    Runs semantic similarity query lookup using cosine similarity in Python.
    """
    if supabase is None:
        raise HTTPException(
            status_code=500,
            detail="Supabase database integration is not configured."
        )
        
    try:
        from app.search.vector_search import vector_search
        results = vector_search(repo_id, query, top_k=limit)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Semantic similarity vector lookup failed: {str(e)}"
        )


@router.post("/repos/{repo_id}/search")
def run_hybrid_search(repo_id: str, request: SearchRequest):
    """
    Executes a hybrid semantic and keyword search on code chunks using Reciprocal Rank Fusion (RRF),
    then uses Groq llama-3.3-70b-versatile to generate a cited natural-language answer.
    """
    try:
        # 1. Fetch ranked hybrid results
        all_results = hybrid_search(repo_id, request.query, top_k=request.top_k)
        
        # 2. Generate natural-language synthesized response with citations
        rag_response = generate_rag_answer(request.query, all_results)
        
        return {
            "answer": rag_response["answer"],
            "cited_chunks": rag_response["cited_chunks"],
            "all_results": all_results
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Hybrid search or RAG execution failed: {str(e)}"
        )

@router.get("/repos/{repo_id}/onboarding-guide")
def get_onboarding_guide(repo_id: str):
    """
    Retrieves or generates the codebase onboarding guide (reading order and summary) for a repo.
    Checks Supabase table onboarding_guides first. If missing, runs the generator and caches it.
    """
    if supabase is not None:
        try:
            cache_check = supabase.table("onboarding_guides")\
                .select("guide_data")\
                .eq("repo_id", repo_id)\
                .execute()
                
            if cache_check.data and len(cache_check.data) > 0:
                print(f"[DevLens AI Cache] Onboarding guide hit for repo: {repo_id}")
                return cache_check.data[0]["guide_data"]
        except Exception as e:
            print(f"[DevLens AI Database Error] Failed to query onboarding_guides cache: {str(e)}")

    # On miss, generate
    guide = generate_onboarding_guide(repo_id)

    # Save to cache if possible
    if supabase is not None and guide.get("summary") != "This is a mock onboarding guide for development. Set up SUPABASE_URL, SUPABASE_KEY, and GROQ_API_KEY to generate live AI codebase analyses.":
        try:
            record = {
                "repo_id": repo_id,
                "guide_data": guide
            }
            supabase.table("onboarding_guides").upsert(record).execute()
            print(f"[DevLens AI Cache] Saved onboarding guide to database for repo: {repo_id}")
        except Exception as e:
            print(f"[DevLens AI Database Error] Failed to cache onboarding guide: {str(e)}")

    return guide

