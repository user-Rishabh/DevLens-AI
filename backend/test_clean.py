import os
import sys
from dotenv import load_dotenv

# Add the backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

load_dotenv()

from app.db import supabase

def main():
    if supabase is None:
        print("Supabase client is not initialized. Check your environment variables.")
        return
        
    print("Supabase client initialized successfully.")
    
    # 1. Let's find unique repo_ids in code_chunks
    try:
        res = supabase.table("code_chunks").select("repo_id").limit(100).execute()
        if res.data:
            repo_ids = {row["repo_id"] for row in res.data}
            print("Unique repo IDs in code_chunks:", repo_ids)
        else:
            print("No data found in code_chunks.")
    except Exception as e:
        print("Error querying code_chunks:", e)

    # 2. Let's query file_contents to see which repo has files
    try:
        res = supabase.table("file_contents").select("repo_id").limit(100).execute()
        if res.data:
            repo_ids = {row["repo_id"] for row in res.data}
            print("Unique repo IDs in file_contents:", repo_ids)
        else:
            print("No data found in file_contents.")
    except Exception as e:
        print("Error querying file_contents:", e)

if __name__ == "__main__":
    main()
