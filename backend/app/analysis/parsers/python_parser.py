import os
import re

# Regex for Python imports
PY_PLAIN_IMPORT_PATTERN = re.compile(r'^\s*import\s+([\w\s,.]+)')
PY_FROM_IMPORT_PATTERN = re.compile(r'^\s*from\s+([.\w]+)\s+import\s+([\w\s,.*()]+)')

def find_matching_file(module_path: str, project_files: set[str], current_file: str) -> str | None:
    """Helper to find matching project file by direct, prefix, or suffix match."""
    if not module_path:
        return None
    target_file = f"{module_path}.py"
    target_init = f"{module_path}/__init__.py"

    # 1. Direct match
    if target_file in project_files:
        return target_file
    if target_init in project_files:
        return target_init

    # 2. Match with top-level directory prefix of current file (e.g. backend/)
    parts = current_file.replace('\\', '/').split('/')
    if len(parts) > 1:
        top_prefix = parts[0]
        prefixed_file = f"{top_prefix}/{target_file}"
        prefixed_init = f"{top_prefix}/{target_init}"
        if prefixed_file in project_files:
            return prefixed_file
        if prefixed_init in project_files:
            return prefixed_init

    # 3. Suffix match against all project files
    suffix_file = f"/{target_file}"
    suffix_init = f"/{target_init}"
    for pf in project_files:
        normalized_pf = pf.replace('\\', '/')
        if normalized_pf.endswith(suffix_file):
            return pf
        if normalized_pf.endswith(suffix_init):
            return pf

    return None

def resolve_py_import(current_file_rel_path: str, import_base: str, imported_symbols: list[str], project_files: set[str]) -> list[str]:
    """
    Resolves Python imports (absolute or relative) to project files.
    """
    resolved_paths = []
    current_dir = os.path.dirname(current_file_rel_path).replace('\\', '/')
    
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
        # Absolute import relative to python path (assumed root level or subfolder)
        base_dir = ""
        
    imported_module_path = '/'.join(filter(None, [base_dir] + module_parts))
    
    # Check if the module is a direct file or folder module (e.g. app/models.py or app/models/__init__.py)
    matched = find_matching_file(imported_module_path, project_files, current_file_rel_path)
    if matched:
        resolved_paths.append(matched)
        
    # Check if any imported symbol resolves to a submodule file (e.g., from app import models)
    for symbol in imported_symbols:
        symbol_path = '/'.join(filter(None, [imported_module_path, symbol]))
        matched_sym = find_matching_file(symbol_path, project_files, current_file_rel_path)
        if matched_sym and matched_sym not in resolved_paths:
            resolved_paths.append(matched_sym)
            
    return resolved_paths

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
                module_path = mod_name.replace('.', '/')
                matched = find_matching_file(module_path, project_files, current_file)
                if matched and matched not in imports:
                    imports.append(matched)
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

