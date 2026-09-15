import os
import json
import tempfile
import glob
# pyrefly: ignore [missing-import]
from supabase import create_client, Client

supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")

supabase: Client = None

if not supabase_url or not supabase_key:
    print("[DevLens AI Warning] Supabase credentials (SUPABASE_URL / SUPABASE_KEY) are missing in the environment.")
else:
    try:
        supabase = create_client(supabase_url, supabase_key)
        print("[DevLens AI] Supabase client initialized successfully.")
    except Exception as e:
        print(f"[DevLens AI Error] Failed to initialize Supabase client: {str(e)}")

# Local resilient in-memory caches
LOCAL_FILE_CONTENTS_CACHE: dict[tuple[str, str], str] = {}
LOCAL_SUMMARIES_CACHE: dict[tuple[str, str], dict] = {}
LOCAL_REPO_ANALYSIS_CACHE: dict[str, dict] = {}

# Local disk cache directory for offline resilience
CACHE_DIR = os.path.join(tempfile.gettempdir(), "devlens_cache")
try:
    os.makedirs(CACHE_DIR, exist_ok=True)
except Exception:
    pass

def save_file_contents(repo_id: str, local_path: str, project_files: set[str]) -> None:
    """
    Reads the raw content of each ingested file, caches it locally in memory and on disk,
    and also attempts to upsert to Supabase table `file_contents`.
    """
    records = []
    repo_cache_dir = os.path.join(CACHE_DIR, repo_id)
    
    for file_rel_path in project_files:
        full_path = os.path.join(local_path, file_rel_path)
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            continue
            
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except OSError:
            continue
            
        # 1. Cache in memory
        LOCAL_FILE_CONTENTS_CACHE[(repo_id, file_rel_path)] = content
        
        # 2. Cache on disk for persistence across restarts
        try:
            disk_file_path = os.path.join(repo_cache_dir, file_rel_path)
            os.makedirs(os.path.dirname(disk_file_path), exist_ok=True)
            with open(disk_file_path, 'w', encoding='utf-8', errors='ignore') as df:
                df.write(content)
        except Exception:
            pass

        records.append({
            "repo_id": repo_id,
            "file_path": file_rel_path,
            "content": content
        })
        
    # 3. Attempt Supabase upload if available
    if supabase is not None and records:
        chunk_size = 100
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            try:
                supabase.table("file_contents").upsert(chunk).execute()
            except Exception as e:
                print(f"[DevLens AI Warning] Could not sync batch to Supabase (using local cache): {str(e)}")
                break

    print(f"[DevLens AI] Ingestion cache complete. Cached {len(records)} files for repo ID: {repo_id}")

def get_file_content(repo_id: str, file_path: str) -> str | None:
    """
    Resiliently retrieves the content of a file:
    1. Checks in-memory cache
    2. Checks disk cache in temp directory
    3. Checks local workspace paths
    4. Checks any active temp clone directory
    5. Checks Supabase if online
    """
    # 1. In-memory cache
    if (repo_id, file_path) in LOCAL_FILE_CONTENTS_CACHE:
        return LOCAL_FILE_CONTENTS_CACHE[(repo_id, file_path)]

    # 2. Local disk cache
    cached_disk_file = os.path.join(CACHE_DIR, repo_id, file_path)
    if os.path.exists(cached_disk_file) and os.path.isfile(cached_disk_file):
        try:
            with open(cached_disk_file, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                LOCAL_FILE_CONTENTS_CACHE[(repo_id, file_path)] = content
                return content
        except Exception:
            pass

    # 3. Local workspace root fallback (e.g. package.json, backend/..., frontend/...)
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    candidate_ws_path = os.path.join(workspace_root, file_path)
    if os.path.exists(candidate_ws_path) and os.path.isfile(candidate_ws_path):
        try:
            with open(candidate_ws_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                LOCAL_FILE_CONTENTS_CACHE[(repo_id, file_path)] = content
                return content
        except Exception:
            pass

    # 4. Search temp clone directories
    temp_matches = glob.glob(os.path.join(tempfile.gettempdir(), "devlens_*", file_path))
    if temp_matches and os.path.isfile(temp_matches[0]):
        try:
            with open(temp_matches[0], 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                LOCAL_FILE_CONTENTS_CACHE[(repo_id, file_path)] = content
                return content
        except Exception:
            pass

    # 5. Fallback to Supabase if reachable
    if supabase is not None:
        try:
            res = supabase.table("file_contents")\
                .select("content")\
                .eq("repo_id", repo_id)\
                .eq("file_path", file_path)\
                .execute()
            if res.data and len(res.data) > 0:
                content = res.data[0].get("content") or ""
                LOCAL_FILE_CONTENTS_CACHE[(repo_id, file_path)] = content
                return content
        except Exception as e:
            print(f"[DevLens AI Warning] Supabase file content fetch failed: {str(e)}")

    return None

def get_cached_file_summary(repo_id: str, file_path: str) -> dict | None:
    """Retrieves cached summary from memory, disk cache, or Supabase."""
    if (repo_id, file_path) in LOCAL_SUMMARIES_CACHE:
        return LOCAL_SUMMARIES_CACHE[(repo_id, file_path)]
        
    # Check local disk cache
    try:
        safe_name = file_path.replace("/", "__").replace("\\", "__") + ".json"
        disk_path = os.path.join(CACHE_DIR, repo_id, "summaries", safe_name)
        if os.path.exists(disk_path):
            with open(disk_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                LOCAL_SUMMARIES_CACHE[(repo_id, file_path)] = data
                return data
    except Exception:
        pass

    if supabase is not None:
        try:
            res = supabase.table("file_summaries")\
                .select("*")\
                .eq("repo_id", repo_id)\
                .eq("file_path", file_path)\
                .execute()
            if res.data and len(res.data) > 0:
                data = res.data[0]
                LOCAL_SUMMARIES_CACHE[(repo_id, file_path)] = data
                return data
        except Exception:
            pass
    return None

def save_file_summary(repo_id: str, file_path: str, summary_data: str | dict, model_used: str) -> None:
    """Caches file summary locally (memory & disk) and syncs to Supabase with structured fields."""
    if isinstance(summary_data, dict):
        purpose = summary_data.get("purpose")
        key_parts = summary_data.get("key_parts")
        connections = summary_data.get("connections")
        summary_text = summary_data.get("summary") or summary_data.get("summary_text") or ""
    else:
        purpose = None
        key_parts = None
        connections = None
        summary_text = str(summary_data)

    record = {
        "summary_text": summary_text,
        "purpose": purpose,
        "key_parts": key_parts,
        "connections": connections,
        "model_used": model_used
    }
    LOCAL_SUMMARIES_CACHE[(repo_id, file_path)] = record
    
    # 2. Persist to disk cache
    try:
        summary_disk_dir = os.path.join(CACHE_DIR, repo_id, "summaries")
        os.makedirs(summary_disk_dir, exist_ok=True)
        safe_name = file_path.replace("/", "__").replace("\\", "__") + ".json"
        with open(os.path.join(summary_disk_dir, safe_name), "w", encoding="utf-8") as f:
            json.dump(record, f)
    except Exception:
        pass

    # 3. Persist to Supabase
    if supabase is not None:
        summary_record = {
            "repo_id": repo_id,
            "file_path": file_path,
            "summary_text": summary_text,
            "model_used": model_used
        }
        if purpose is not None:
            summary_record["purpose"] = purpose
        if key_parts is not None:
            summary_record["key_parts"] = key_parts
        if connections is not None:
            summary_record["connections"] = connections

        try:
            supabase.table("file_summaries").upsert(summary_record).execute()
        except Exception as e:
            # Fallback if table doesn't have the new structured columns yet
            try:
                fallback_record = {
                    "repo_id": repo_id,
                    "file_path": file_path,
                    "summary_text": summary_text,
                    "model_used": model_used
                }
                supabase.table("file_summaries").upsert(fallback_record).execute()
            except Exception as e2:
                print(f"[DevLens AI Warning] Failed to cache summary to Supabase: {str(e2)}")

def save_repo_analysis(repo_id: str, file_tree: dict, dependencies: list, hotspots: list) -> None:
    """
    Saves the analyzed repository metadata in memory, on disk, and attempts Supabase table `repo_analyses`.
    """
    record = {
        "repo_id": repo_id,
        "file_tree": file_tree,
        "dependencies": dependencies,
        "hotspots": hotspots
    }
    
    # 1. In-memory cache
    LOCAL_REPO_ANALYSIS_CACHE[repo_id] = record
    
    # 2. Disk cache
    try:
        analysis_path = os.path.join(CACHE_DIR, f"{repo_id}_analysis.json")
        with open(analysis_path, 'w', encoding='utf-8') as f:
            json.dump(record, f)
    except Exception:
        pass

    # 3. Supabase
    if supabase is not None:
        try:
            supabase.table("repo_analyses").upsert(record).execute()
            print(f"[DevLens AI] Saved analysis metadata to Supabase for repo ID: {repo_id}")
        except Exception as e:
            print(f"[DevLens AI Warning] Failed to save repo analysis to Supabase (using local cache): {str(e)}")

def get_repo_analysis(repo_id: str) -> dict | None:
    """Retrieves repo analysis metadata from memory, disk, Supabase, or workspace fallback."""
    def refresh_from_workspace() -> dict | None:
        try:
            from app.ingestion.filter import build_file_tree
            from app.analysis.dependency_graph import extract_dependencies
            from app.analysis.git_hotspots import get_hotspots
            
            workspace_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
            file_tree = build_file_tree(workspace_root)
            if file_tree:
                deps = extract_dependencies(workspace_root, file_tree)
                try:
                    spots = get_hotspots(workspace_root)
                except Exception:
                    spots = []
                record = {
                    "repo_id": repo_id,
                    "file_tree": file_tree,
                    "dependencies": deps,
                    "hotspots": spots
                }
                LOCAL_REPO_ANALYSIS_CACHE[repo_id] = record
                analysis_path = os.path.join(CACHE_DIR, f"{repo_id}_analysis.json")
                try:
                    with open(analysis_path, 'w', encoding='utf-8') as wf:
                        json.dump(record, wf)
                except Exception:
                    pass
                return record
        except Exception as e:
            print(f"[DevLens AI Warning] Failed to dynamically generate repo analysis: {str(e)}")
        return None

    data = None
    if repo_id in LOCAL_REPO_ANALYSIS_CACHE:
        data = LOCAL_REPO_ANALYSIS_CACHE[repo_id]
        
    # 1. Check exact repo_id analysis file on disk
    if not data:
        analysis_path = os.path.join(CACHE_DIR, f"{repo_id}_analysis.json")
        if os.path.exists(analysis_path):
            try:
                with open(analysis_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    LOCAL_REPO_ANALYSIS_CACHE[repo_id] = data
            except Exception:
                pass
            
    # 2. Check Supabase
    if not data and supabase is not None:
        try:
            res = supabase.table("repo_analyses").select("*").eq("repo_id", repo_id).execute()
            if res.data and len(res.data) > 0:
                data = res.data[0]
                LOCAL_REPO_ANALYSIS_CACHE[repo_id] = data
        except Exception:
            pass

    # Check if loaded data has rich dependencies (including thorough python dependencies)
    if data and data.get("dependencies"):
        py_deps = [d for d in data.get("dependencies", []) if d.get("from", "").endswith(".py")]
        if len(py_deps) >= 10:
            return data

    # Refresh from workspace root to guarantee full Python & TypeScript dependencies
    fresh = refresh_from_workspace()
    if fresh and fresh.get("dependencies"):
        return fresh

    return data if data else fresh




