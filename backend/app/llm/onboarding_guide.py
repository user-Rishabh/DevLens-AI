import os
import json
import time
from fastapi import HTTPException
from app.db import supabase
from app.analysis.entry_points import detect_entry_points
from app.analysis.dependency_graph import get_all_project_files

try:
    from groq import Groq
    from groq import RateLimitError, APIStatusError
    HAS_GROQ_SDK = True
except ImportError:
    HAS_GROQ_SDK = False
    RateLimitError = Exception
    APIStatusError = Exception

def generate_onboarding_guide(repo_id: str) -> dict:
    """
    Gathers entry points, hotspots, structurally central files, and their summaries.
    Sends this codebase context to Groq to generate a suggested reading order and codebase summary.
    """
    # 1. Fallback for Local Dev Mode when Supabase is not configured or missing Groq API Key
    api_key_current = os.getenv("GROQ_API_KEY")
    if supabase is None or not api_key_current or not HAS_GROQ_SDK:
        print("[DevLens AI Warning] Supabase, Groq SDK or GROQ_API_KEY is missing. Using fallback onboarding guide.")
        return {
            "reading_order": [
                {
                    "file_path": "backend/app/main.py",
                    "reason": "Start here — this is the main entry point and sets up the FastAPI application routing and middleware.",
                    "category": "entry_point"
                },
                {
                    "file_path": "backend/app/db.py",
                    "reason": "Read this next — it's imported by most other modules and defines connection helpers for Supabase database caching.",
                    "category": "structural"
                },
                {
                    "file_path": "frontend/src/pages/Home.tsx",
                    "reason": "Worth reviewing — frequently changed page, contains the core workspace container logic and tab managers.",
                    "category": "hotspot"
                }
            ],
            "summary": "This is a mock onboarding guide for development. Set up SUPABASE_URL, SUPABASE_KEY, and GROQ_API_KEY to generate live AI codebase analyses."
        }

    # 2. Fetch repo analysis metadata from database
    try:
        analysis_query = supabase.table("repo_analyses")\
            .select("*")\
            .eq("repo_id", repo_id)\
            .execute()
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database query failed when fetching repo analysis: {str(e)}"
        )

    if not analysis_query.data or len(analysis_query.data) == 0:
        raise HTTPException(
            status_code=404,
            detail=f"Analysis metadata not found for repository ID: {repo_id}. Please ingest it first."
        )

    analysis_data = analysis_query.data[0]
    file_tree = analysis_data.get("file_tree") or {}
    dependencies = analysis_data.get("dependencies") or []
    hotspots = analysis_data.get("hotspots") or []

    # 3. Identify candidate files
    project_files = get_all_project_files(file_tree)
    
    # Conventional entry points
    entry_point_names = {
        "main.py", "app.py", "index.js", "index.ts", "app.js", "app.ts",
        "app.tsx", "app.jsx", "main.tsx", "main.jsx", "server.py", "manage.py",
        "server.js", "server.ts", "index.jsx", "index.tsx", "wsgi.py", "asgi.py"
    }
    entry_points = []
    for file_path in project_files:
        basename = os.path.basename(file_path).lower()
        if basename in entry_point_names:
            entry_points.append(file_path)
            
    # Structurally central (in-degree ranking)
    in_degrees = {}
    for edge in dependencies:
        to_file = edge.get("to")
        if to_file and to_file in project_files:
            in_degrees[to_file] = in_degrees.get(to_file, 0) + 1
            
    structurally_central = sorted(
        [f for f in in_degrees.keys() if in_degrees[f] > 0],
        key=lambda f: in_degrees[f],
        reverse=True
    )
    
    # Gather candidates: top 5 entry points, top 5 structural, top 5 hotspots
    cand_eps = entry_points[:5]
    cand_structural = [f for f in structurally_central if f not in cand_eps][:5]
    
    hotspot_paths = [h["path"] for h in hotspots]
    cand_hotspots = [f for f in hotspot_paths if f not in cand_eps and f not in cand_structural][:5]
    
    candidate_files = list(set(cand_eps + cand_structural + cand_hotspots))
    
    if not candidate_files:
        # Fallback if no files detected (extremely small or empty repo)
        candidate_files = sorted(list(project_files))[:5]

    # 4. Pull cached file summaries
    try:
        summaries_query = supabase.table("file_summaries")\
            .select("file_path, summary_text")\
            .eq("repo_id", repo_id)\
            .in_("file_path", candidate_files)\
            .execute()
            
        summaries_map = {row["file_path"]: row["summary_text"] for row in summaries_query.data}
    except Exception as e:
        print(f"[DevLens AI Database Warning] Failed to fetch file_summaries for onboarding: {str(e)}")
        summaries_map = {}

    # 5. Format codebase signals for the LLM
    formatted_candidates = []
    for path in candidate_files:
        flags = []
        is_ep = path in entry_points
        in_deg = in_degrees.get(path, 0)
        
        # Check if it is a hotspot and find its commit count
        is_hs = False
        commits = 0
        for h in hotspots:
            if h["path"] == path:
                is_hs = True
                commits = h["commit_count"]
                break
                
        if is_ep:
            flags.append("entry_point")
        if in_deg > 0:
            flags.append(f"structural (imported by {in_deg} files)")
        if is_hs:
            flags.append(f"hotspot ({commits} commits)")
            
        summary = summaries_map.get(path, "No detailed summary available.")
        
        formatted_candidates.append(
            f"File: {path}\n"
            f"Signals: {', '.join(flags)}\n"
            f"Summary: {summary}\n"
        )
        
    candidates_context = "\n".join(formatted_candidates)

    # 6. Groq LLM Completion prompt
    system_prompt = (
        "You are a Senior Software Architect reviewing a codebase.\n"
        "Your task is to automatically suggest a sensible reading order for a new contributor to understand the project.\n"
        "Suggest which files to look at first and why. Base this on structural importance, conventions, and change frequency.\n\n"
        "Instructions:\n"
        "1. Suggest a reading list of 3 to 8 of the most important files. Rank them logically (e.g. entry points first, then core utilities, then active business logic/hotspots).\n"
        "2. For each file, provide a 1-sentence reason explaining why they should read it and where it fits in the sequence.\n"
        "3. Assign a single category to each file: 'entry_point', 'structural', or 'hotspot'. Use 'entry_point' for startup/routing configs, 'structural' for core abstractions/common utilities, and 'hotspot' for frequently-modified files containing active business logic.\n"
        "4. Create a 2-3 sentence overview of the codebase's overall shape, technology stack, and purpose as the 'summary'.\n"
        "5. Output must be a valid JSON object matching the following structure:\n"
        "{\n"
        "  \"reading_order\": [\n"
        "    {\n"
        "      \"file_path\": \"relative/path/to/file\",\n"
        "      \"reason\": \"Startup entry point that configures the application routes and middleware.\",\n"
        "      \"category\": \"entry_point\"\n"
        "    }\n"
        "  ],\n"
        "  \"summary\": \"Overall codebase shape summary...\"\n"
        "}\n"
        "Do not include any preambles, introductory comments, or trailing text. Return ONLY the JSON object."
    )

    user_prompt = (
        f"Here are the key files detected in the codebase along with their signals and summaries:\n\n"
        f"{candidates_context}\n\n"
        f"Please generate the codebase onboarding guide."
    )

    try:
        client = Groq(api_key=api_key_current)
    except Exception as e:
        print(f"[DevLens AI Error] Failed to initialize Groq client for onboarding guide: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize Groq client: {str(e)}"
        )

    # Call LLM with 2-attempt backoff retry for transient rate limits
    max_retries = 2
    backoffs = [2.0, 5.0]

    for attempt in range(max_retries + 1):
        try:
            chat_completion = client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model="llama-3.3-70b-versatile",
                temperature=0.2,
                response_format={"type": "json_object"},
                max_tokens=800
            )
            
            raw_response = chat_completion.choices[0].message.content.strip()
            parsed = json.loads(raw_response)
            
            # Sanity check keys
            if "reading_order" not in parsed or "summary" not in parsed:
                raise ValueError("Generated JSON is missing required fields.")
                
            return parsed
            
        except RateLimitError as e:
            if attempt < max_retries:
                sleep_time = backoffs[attempt]
                print(f"[DevLens AI] Onboarding Guide rate limited. Retrying in {sleep_time}s... ({attempt + 1}/{max_retries})")
                time.sleep(sleep_time)
            else:
                raise HTTPException(
                    status_code=429,
                    detail="Groq API rate limit reached. Please wait a moment and try again."
                )
        except json.JSONDecodeError as e:
            print(f"[DevLens AI Error] LLM returned invalid JSON: {raw_response}")
            if attempt == max_retries:
                raise HTTPException(
                    status_code=502,
                    detail=f"Groq API returned malformed response: {str(e)}"
                )
        except Exception as e:
            print(f"[DevLens AI Error] Unexpected exception during guide generation: {str(e)}")
            if attempt == max_retries:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate onboarding guide: {str(e)}"
                )
