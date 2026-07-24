import os
import time
import json
from fastapi import HTTPException
from app.db import supabase
from app.llm.summarizer import HAS_GROQ_SDK

# Fallback import of Groq
try:
    from groq import Groq
except ImportError:
    pass

def get_module_path(file_path: str) -> str:
    """
    Determines the module/directory path to group files.
    Uses a dynamic depth heuristic:
    - 3 levels for 'src/app/...', 'src/pages/...', 'src/components/...', and 'backend/app/...'
      because these contain the core modular elements of the app.
    - 2 levels for other folders (e.g. 'db/migrations/...', 'backend/tests/...').
    - 'Root' for root level files.
    """
    parts = file_path.split('/')
    if len(parts) <= 1:
        return "Root"
    
    if len(parts) >= 3:
        if parts[0] == "src" and parts[1] in ["app", "pages", "components"]:
            return "/".join(parts[:3])
        if parts[0] == "backend" and parts[1] == "app":
            return "/".join(parts[:3])
            
    return "/".join(parts[:2])

def generate_module_docs(repo_id: str) -> list[dict]:
    """
    Groups repository files by module, gathers cached file summaries and dependency edges,
    and calls Groq llama-3.3-70b-versatile to synthesize per-module markdown README documents.
    """
    if supabase is None:
        raise HTTPException(status_code=500, detail="Supabase integration is not configured.")

    api_key_current = os.getenv("GROQ_API_KEY")
    if not api_key_current or not HAS_GROQ_SDK:
        raise HTTPException(
            status_code=500,
            detail="Groq SDK or GROQ_API_KEY is not configured. Cannot generate module documentation."
        )

    try:
        # 1. Fetch all cached file summaries
        summaries_res = supabase.table("file_summaries")\
            .select("file_path, summary_text")\
            .eq("repo_id", repo_id)\
            .execute()
            
        if not summaries_res.data:
            # Check if files exist at all in the database
            files_check = supabase.table("file_contents")\
                .select("file_path")\
                .eq("repo_id", repo_id)\
                .limit(1)\
                .execute()
            if not files_check.data:
                raise HTTPException(status_code=404, detail="Repository content not found. Ingest the repository first.")
            else:
                raise HTTPException(status_code=400, detail="No file summaries generated yet. Please select files to summarize or run indexing first.")

        # 2. Fetch dependencies metadata to understand relationships
        dep_res = supabase.table("file_contents")\
            .select("content")\
            .eq("repo_id", repo_id)\
            .eq("file_path", ".devlens/dependencies.json")\
            .execute()
            
        dependencies = []
        if dep_res.data:
            try:
                dependencies = json.loads(dep_res.data[0]["content"])
            except Exception:
                pass

        # 3. Group files by module path
        module_groups = {}
        for row in summaries_res.data:
            file_path = row["file_path"]
            if file_path.startswith(".devlens/"):
                continue
            module = get_module_path(file_path)
            if module not in module_groups:
                module_groups[module] = []
            module_groups[module].append(row)

        client = Groq(api_key=api_key_current)
        module_docs = []

        # 4. Synthesize documentation for each group
        for module_path, files in module_groups.items():
            file_summaries_text = ""
            file_paths_in_module = {f["file_path"] for f in files}
            
            for f in files:
                file_summaries_text += f"- **{f['file_path']}**:\n  {f['summary_text']}\n\n"

            # Filter relevant dependencies (edges that start or end in this module)
            relevant_deps = []
            for edge in dependencies:
                frm = edge.get("from")
                to = edge.get("to")
                if frm and to:
                    if frm in file_paths_in_module or to in file_paths_in_module:
                        relevant_deps.append(f"- `{frm}` depends on `{to}`")
            
            dependencies_text = "\n".join(relevant_deps) if relevant_deps else "No direct dependency relationships detected."

            # Construct Prompt
            prompt = (
                f"You are a Senior Software Architect reviewing a codebase.\n"
                f"Write a professional, cohesive README-style documentation overview for the module directory: '{module_path}'.\n\n"
                f"Here are the files in this directory and their cached summaries:\n"
                f"{file_summaries_text}\n"
                f"Here are the known code dependency links related to this directory:\n"
                f"{dependencies_text}\n\n"
                f"Write a structured overview containing:\n"
                f"1. **Module Purpose**: What is the overall responsibility of this folder in the codebase?\n"
                f"2. **Key Files & Roles**: Synthesize the roles of the files in this module. Avoid copying file summaries word-for-word; write a cohesive synthesis.\n"
                f"3. **Dependencies & Data Flow**: Explain the internal interactions or how this module interacts with the rest of the application based on the dependency data.\n\n"
                f"Ensure the output is clean, formatted in professional markdown (using appropriate headers, bullet points, and code styling), and geared towards onboarding a new developer.\n"
                f"Do not write any introductory or concluding meta-commentary. Output the markdown documentation directly."
            )

            # Generate Doc via Groq Llama 3.3 70B
            doc_content = "Failed to generate documentation."
            try:
                # Add small delay to avoid rate-limits
                time.sleep(0.5)
                chat_completion = client.chat.completions.create(
                    messages=[
                        {
                            "role": "user",
                            "content": prompt,
                        }
                    ],
                    model="llama-3.3-70b-versatile",
                    temperature=0.2,
                    max_tokens=800
                )
                if chat_completion.choices:
                    doc_content = chat_completion.choices[0].message.content.strip()
            except Exception as e:
                print(f"[DevLens AI Error] Failed to generate doc for module {module_path}: {str(e)}")
                doc_content = f"### {module_path}\n\nError generating documentation: {str(e)}"

            module_docs.append({
                "module_path": module_path,
                "doc_content": doc_content,
                "file_count": len(files)
            })

        return module_docs

    except Exception as e:
        import traceback
        print(f"[DevLens AI Error] generate_module_docs failed: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to generate module documentation: {str(e)}")
