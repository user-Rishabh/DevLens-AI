import os
import sys
from dotenv import load_dotenv

# Add backend directory to sys.path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_path)

load_dotenv()

from app.db import supabase

def test_tables():
    if supabase is None:
        print("Supabase client is not initialized!")
        return

    tables_to_test = ["file_contents", "file_summaries", "code_chunks", "dependencies", "hotspots"]
    for table in tables_to_test:
        try:
            res = supabase.table(table).select("*").limit(1).execute()
            print(f"Table '{table}' exists! Data preview: {res.data}")
        except Exception as e:
            print(f"Table '{table}' does NOT exist or failed to query: {e}")

if __name__ == "__main__":
    test_tables()
