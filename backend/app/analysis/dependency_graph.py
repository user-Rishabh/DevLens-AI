import os
from .parsers.js_parser import parse_js_ts_imports
from .parsers.python_parser import parse_python_imports

def get_all_project_files(file_tree: dict) -> set[str]:
    """
    Traverses the file tree dictionary and returns a set of all relative file paths.
    """
    files = set()
    def traverse(node):
        if not node:
            return
        if node.get("type") == "file":
            path = node.get("path")
            if path:
                files.add(path)
        elif node.get("type") == "folder":
            for child in node.get("children", []):
                traverse(child)
    traverse(file_tree)
    return files

def extract_dependencies(local_path: str, file_tree: dict) -> list[dict]:
    """
    Analyzes Python, JS, and TS files to extract internal file-to-file import edges.
    Returns a list of edges: [{"from": "file_a", "to": "file_b"}]
    """
    project_files = get_all_project_files(file_tree)
    edges = []
    
    for file_rel_path in project_files:
        full_path = os.path.join(local_path, file_rel_path)
        if not os.path.exists(full_path):
            continue
            
        # Determine language parser
        _, ext = os.path.splitext(file_rel_path)
        ext = ext.lower()
        
        try:
            with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except OSError:
            continue
            
        imported_files = []
        if ext in ['.js', '.jsx', '.ts', '.tsx']:
            imported_files = parse_js_ts_imports(content, file_rel_path, project_files)
        elif ext == '.py':
            imported_files = parse_python_imports(content, file_rel_path, project_files)
            
        for target in imported_files:
            # Avoid self-dependencies
            if target != file_rel_path:
                edges.append({
                    "from": file_rel_path,
                    "to": target
                })
                
    return edges
