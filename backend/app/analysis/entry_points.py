import os
from app.analysis.dependency_graph import get_all_project_files

def detect_entry_points(file_tree: dict, dependencies: list) -> list[str]:
    """
    Identifies and ranks files to read in a repository using two signals:
    1. Common entry point filename patterns (e.g. main.py, app.py, index.js/ts, App.tsx, server.py).
    2. Structural centrality: files imported by many other files (high in-degree in the dependency graph).
    
    Returns a ranked, deduplicated list of relative file paths.
    """
    project_files = get_all_project_files(file_tree)
    
    # 1. Identify conventional entry points
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
            
    # Sort entry points: files closer to the root (shallower depth) and/or starting with "main" or "index" first
    def entry_point_sort_key(path):
        basename = os.path.basename(path).lower()
        depth = path.count('/')
        # main/index/app are higher priority than wsgi/manage/server
        priority = 3
        if "main" in basename or "index" in basename:
            priority = 1
        elif "app" in basename:
            priority = 2
        return (priority, depth, path)
        
    entry_points.sort(key=entry_point_sort_key)
    
    # 2. Identify structurally central files (high in-degree)
    in_degrees = {}
    for edge in dependencies:
        to_file = edge.get("to")
        if to_file and to_file in project_files:
            in_degrees[to_file] = in_degrees.get(to_file, 0) + 1
            
    # Sort files by in-degree descending
    structurally_central = sorted(
        [f for f in in_degrees.keys() if in_degrees[f] > 0],
        key=lambda f: in_degrees[f],
        reverse=True
    )
    
    # Combine both signals, deduplicated
    seen = set()
    combined = []
    
    # Conventional entry points first
    for ep in entry_points:
        if ep not in seen:
            seen.add(ep)
            combined.append(ep)
            
    # Structurally central files second
    for sc in structurally_central:
        if sc not in seen:
            seen.add(sc)
            combined.append(sc)
            
    return combined
