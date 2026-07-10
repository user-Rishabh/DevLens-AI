import os
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

def save_file_contents(repo_id: str, local_path: str, project_files: set[str]) -> None:
    """
    Reads the raw content of each ingested file and saves it in Supabase table `file_contents`.
    Uploads in chunks of 100 to avoid payload size constraints.
    """
    if supabase is None:
        print("[DevLens AI Error] Caching aborted: Supabase client is not initialized.")
        return
        
    records = []
    for file_rel_path in project_files:
        full_path = os.path.join(local_path, file_rel_path)
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            continue
            
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except OSError:
            continue
            
        records.append({
            "repo_id": repo_id,
            "file_path": file_rel_path,
            "content": content
        })
        
    # Bulk upload records
    if records:
        chunk_size = 100
        for i in range(0, len(records), chunk_size):
            chunk = records[i:i + chunk_size]
            try:
                # Upsert updates existing entries for the same repo_id + file_path
                supabase.table("file_contents").upsert(chunk).execute()
            except Exception as e:
                print(f"[DevLens AI Error] Failed to cache batch of file contents: {str(e)}")
        print(f"[DevLens AI] Ingestion cache complete. Cached {len(records)} files for repo ID: {repo_id}")
