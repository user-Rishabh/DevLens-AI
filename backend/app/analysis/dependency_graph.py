import os
import re

# Regex for JS/TS imports & requires
JS_IMPORT_PATTERN = re.compile(r'import\s+.*\s+from\s+[\'"]([^\'"]+)[\'"]')
JS_SIDE_EFFECT_IMPORT_PATTERN = re.compile(r'import\s+[\'"]([^\'"]+)[\'"]')
JS_REQUIRE_PATTERN = re.compile(r'require\([\'"]([^\'"]+)[\'"]\)')

# Regex for Python imports
PY_PLAIN_IMPORT_PATTERN = re.compile(r'^\s*import\s+([\w\s,.]+)')
PY_FROM_IMPORT_PATTERN = re.compile(r'^\s*from\s+([.\w]+)\s+import\s+([\w\s,.*()]+)')

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

def resolve_js_import(current_file_rel_path: str, import_str: str, project_files: set[str]) -> str | None:
    """
    Resolves relative JS/TS imports to a file in the project.
    Ignores external imports (which don't start with '.' or '/').
    """
    if not (import_str.startswith('./') or import_str.startswith('../')):
        return None  # External package
        
    current_dir = os.path.dirname(current_file_rel_path)
    # Join and normalize paths
    resolved_raw = os.path.normpath(os.path.join(current_dir, import_str)).replace(os.path.sep, '/')
    if resolved_raw.startswith('.'):
        return None
        
    # List of possible extensions to try
    possible_extensions = ['.tsx', '.ts', '.jsx', '.js', '.json']
    
    # Try extensions
    for ext in possible_extensions:
        test_path = f"{resolved_raw}{ext}"
        if test_path in project_files:
            return test_path
            
    # Try index files (e.g. folder imports)
    for ext in possible_extensions:
        test_path = f"{resolved_raw}/index{ext}"
        if test_path in project_files:
            return test_path
            
    return None

def resolve_py_import(current_file_rel_path: str, import_base: str, imported_symbols: list[str], project_files: set[str]) -> list[str]:
    """
    Resolves Python imports (absolute or relative) to project files.
    """
    resolved_paths = []
    current_dir = os.path.dirname(current_file_rel_path)
    
    # Count leading dots for relative imports
    leading_dots = 0
    for char in import_base:
        if char == '.':
            leading_dots += 1
        else:
            break
            
    module_path_str = import_base[leading_dots:]
    module_parts = module_path_str.split('.') if module_path_str else []
    
    if leading_dots > 0:
        # Relative import
        parts = current_dir.split('/') if current_dir else []
        # If 1 dot: current directory. If 2 dots: parent directory (pop 1 part), etc.
        for _ in range(leading_dots - 1):
            if parts:
                parts.pop()
        base_dir = '/'.join(parts)
    else:
        # Absolute import relative to python path (assumed root level)
        base_dir = ""
        
    imported_module_path = '/'.join(filter(None, [base_dir] + module_parts))
    
    # Check if the module is a direct file or folder module (e.g. app/models.py or app/models/__init__.py)
    if f"{imported_module_path}.py" in project_files:
        resolved_paths.append(f"{imported_module_path}.py")
    elif f"{imported_module_path}/__init__.py" in project_files:
        resolved_paths.append(f"{imported_module_path}/__init__.py")
        
    # Check if any imported symbol resolves to a submodule file (e.g., from app import models)
    for symbol in imported_symbols:
        symbol_path = '/'.join(filter(None, [imported_module_path, symbol]))
        if f"{symbol_path}.py" in project_files:
            resolved_paths.append(f"{symbol_path}.py")
        elif f"{symbol_path}/__init__.py" in project_files:
            resolved_paths.append(f"{symbol_path}/__init__.py")
            
    return resolved_paths

def parse_js_ts_imports(file_content: str, current_file: str, project_files: set[str]) -> list[str]:
    imports = []
    # Find ES import statements
    for match in JS_IMPORT_PATTERN.finditer(file_content):
        resolved = resolve_js_import(current_file, match.group(1), project_files)
        if resolved:
            imports.append(resolved)
            
    # Find ES side-effect import statements
    for match in JS_SIDE_EFFECT_IMPORT_PATTERN.finditer(file_content):
        resolved = resolve_js_import(current_file, match.group(1), project_files)
        if resolved and resolved not in imports:
            imports.append(resolved)
            
    # Find CommonJS require statements
    for match in JS_REQUIRE_PATTERN.finditer(file_content):
        resolved = resolve_js_import(current_file, match.group(1), project_files)
        if resolved and resolved not in imports:
            imports.append(resolved)
            
    return imports

def parse_python_imports(file_content: str, current_file: str, project_files: set[str]) -> list[str]:
    imports = []
    lines = file_content.splitlines()
    
    for line in lines:
        # Check for plain import (e.g. import app.models, sys)
        plain_match = PY_PLAIN_IMPORT_PATTERN.match(line)
        if plain_match:
            modules_raw = plain_match.group(1).split(',')
            for mod_raw in modules_raw:
                # Remove alias if present (e.g., import os as system)
                mod_name = mod_raw.split(' as ')[0].strip()
                # Check absolute path
                module_path = mod_name.replace('.', '/')
                if f"{module_path}.py" in project_files:
                    imports.append(f"{module_path}.py")
                elif f"{module_path}/__init__.py" in project_files:
                    imports.append(f"{module_path}/__init__.py")
            continue
            
        # Check for from module import symbols (e.g. from app.models import user)
        from_match = PY_FROM_IMPORT_PATTERN.match(line)
        if from_match:
            import_base = from_match.group(1)
            # Split and clean symbols
            symbols_raw = from_match.group(2).replace('(', '').replace(')', '').split(',')
            symbols = [sym.split(' as ')[0].strip() for sym in symbols_raw if sym.strip()]
            
            resolved_paths = resolve_py_import(current_file, import_base, symbols, project_files)
            for path in resolved_paths:
                if path not in imports:
                    imports.append(path)
                    
    return imports

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
