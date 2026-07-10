import os
import subprocess

def get_hotspots(local_path: str) -> list[dict]:
    """
    Analyzes git history to extract the commit frequency per file.
    Returns a ranked list of the top 20 files, sorted descending:
    [{"path": "relative/path.ts", "commit_count": 47}]
    """
    if not os.path.exists(local_path) or not os.path.isdir(local_path):
        return []

    # Run git log displaying only names of modified files in history
    cmd = ["git", "log", "--name-only", "--pretty=format:"]

    try:
        result = subprocess.run(
            cmd,
            cwd=local_path,
            capture_output=True,
            text=True,
            check=True,
            timeout=15
        )
    except (subprocess.SubprocessError, FileNotFoundError, subprocess.TimeoutExpired) as e:
        # Return empty list gracefully if command fails (e.g. git is not installed, no commits, or timeout)
        print(f"[DevLens AI Warning] Git log parsing skipped: {str(e)}")
        return []

    commit_counts = {}
    lines = result.stdout.splitlines()

    for line in lines:
        file_path = line.strip()
        if not file_path:
            continue
            
        # Normalize separators
        file_path_normalized = file_path.replace(os.path.sep, '/')
        
        # Verify the file still exists in the current working copy (skip files deleted in git history)
        full_path = os.path.join(local_path, file_path_normalized)
        if os.path.isfile(full_path):
            commit_counts[file_path_normalized] = commit_counts.get(file_path_normalized, 0) + 1

    # Sort descending by commit frequency
    ranked_hotspots = sorted(
        commit_counts.items(),
        key=lambda x: x[1],
        reverse=True
    )

    # Format output for top 20 records
    return [
        {"path": path, "commit_count": count} 
        for path, count in ranked_hotspots[:20]
    ]
