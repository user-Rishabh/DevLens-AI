import os
import sys
from dotenv import load_dotenv

# Add backend directory to sys.path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_path)
os.chdir(backend_path)

load_dotenv()

from app.db import supabase

def run_diagnostics():
    if supabase is None:
        print("Supabase client is None!")
        return

    print("Supabase client initialized.")
    try:
        res = supabase.table("code_chunks").select("id, repo_id, file_path").limit(10).execute()
        print("First 10 code chunks:")
        for row in res.data:
            print(f"ID: {row['id']}, Repo ID: {repr(row['repo_id'])}, File Path: {row['file_path']}")
        
        count_res = supabase.table("code_chunks").select("id", count="exact").limit(1).execute()
        print(f"Total count of chunks in DB: {count_res.count}")

        all_res = supabase.table("code_chunks").select("repo_id").execute()
        unique_repos = set(row['repo_id'] for row in all_res.data)
        print(f"Unique repo_ids in table: {unique_repos}")

    except Exception as e:
        print(f"Error querying code_chunks: {e}")

if __name__ == "__main__":
    run_diagnostics()
