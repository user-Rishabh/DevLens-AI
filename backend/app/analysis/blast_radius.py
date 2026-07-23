from collections import defaultdict, deque
from app.db import supabase

def compute_blast_radius(repo_id: str, file_path: str, max_depth: int = 3, dependencies: list[dict] = None) -> dict:
    """
    Computes the blast radius for a given file in a repository:
    finds all files that depend on it directly or transitively up to max_depth.
    
    Returns:
    {
        "file_path": string,
        "direct_dependents": [file_path, ...],
        "transitive_dependents": [
            {
                "file_path": string,
                "depth": int,
                "path": [target, direct_dep, ..., transitive_dep]
            }
        ],
        "total_affected_count": int
    }
    """
    # Normalize input file_path
    normalized_target = file_path.replace('\\', '/').lstrip('/')

    # 1. Obtain dependency edges if not passed explicitly
    if dependencies is None:
        dependencies = []
        if supabase is not None:
            try:
                res = supabase.table("repo_analyses")\
                    .select("dependencies")\
                    .eq("repo_id", repo_id)\
                    .execute()
                if res.data and len(res.data) > 0 and res.data[0].get("dependencies"):
                    dependencies = res.data[0]["dependencies"]
            except Exception as e:
                print(f"[DevLens AI Warning] Failed to query dependencies for blast radius: {str(e)}")

    if not dependencies:
        return {
            "file_path": normalized_target,
            "direct_dependents": [],
            "transitive_dependents": [],
            "total_affected_count": 0
        }

    # 2. Build reverse adjacency graph: target -> list of files importing target
    # Edge format: {"from": importer, "to": imported}
    reverse_adj = defaultdict(list)
    for edge in dependencies:
        src = edge.get("from", "").replace('\\', '/').lstrip('/')
        tgt = edge.get("to", "").replace('\\', '/').lstrip('/')
        if src and tgt and src != tgt:
            reverse_adj[tgt].append(src)

    # 3. BFS Traversal with cycle prevention using a visited set
    visited = set([normalized_target])
    direct_dependents = []
    transitive_dependents = []

    queue = deque()

    # Depth 1: Direct dependents
    for direct_dep in reverse_adj.get(normalized_target, []):
        if direct_dep not in visited:
            visited.add(direct_dep)
            direct_dependents.append(direct_dep)
            queue.append((direct_dep, [normalized_target, direct_dep], 1))

    # Depth 2 to max_depth: Transitive dependents
    while queue:
        curr_node, curr_path, curr_depth = queue.popleft()
        if curr_depth < max_depth:
            for neighbor in reverse_adj.get(curr_node, []):
                if neighbor not in visited:
                    visited.add(neighbor)
                    next_depth = curr_depth + 1
                    next_path = curr_path + [neighbor]
                    transitive_dependents.append({
                        "file_path": neighbor,
                        "depth": next_depth,
                        "path": next_path
                    })
                    queue.append((neighbor, next_path, next_depth))

    total_affected_count = len(direct_dependents) + len(transitive_dependents)

    return {
        "file_path": normalized_target,
        "direct_dependents": direct_dependents,
        "transitive_dependents": transitive_dependents,
        "total_affected_count": total_affected_count
    }
