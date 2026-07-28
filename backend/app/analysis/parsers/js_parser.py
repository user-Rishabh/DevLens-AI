import os
import re

# Regex for JS/TS imports & requires
JS_IMPORT_PATTERN = re.compile(r'import\s+.*\s+from\s+[\'"]([^\'"]+)[\'"]')
JS_SIDE_EFFECT_IMPORT_PATTERN = re.compile(r'import\s+[\'"]([^\'"]+)[\'"]')
JS_REQUIRE_PATTERN = re.compile(r'require\([\'"]([^\'"]+)[\'"]\)')

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
