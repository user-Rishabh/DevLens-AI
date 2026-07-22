import os
import time
try:
    from tree_sitter import Language, Parser
    HAS_TREE_SITTER = True
except ImportError:
    HAS_TREE_SITTER = False
    Language = None
    Parser = None

PY_LANGUAGE = None
JS_LANGUAGE = None
TS_LANGUAGE = None
TSX_LANGUAGE = None

if HAS_TREE_SITTER:
    try:
        import tree_sitter_python as tspython
        PY_LANGUAGE = Language(tspython.language())
    except (ImportError, AttributeError):
        pass

    try:
        import tree_sitter_javascript as tsjavascript
        JS_LANGUAGE = Language(tsjavascript.language())
    except (ImportError, AttributeError):
        pass

    try:
        import tree_sitter_typescript as ts_typescript
        TS_LANGUAGE = Language(ts_typescript.language())
        TSX_LANGUAGE = Language(ts_typescript.language_tsx())
    except (ImportError, AttributeError):
        pass

from app.db import supabase
from app.search.embeddings import embed_chunks_batch

def detect_language(file_path: str) -> str:
    """
    Detects language based on file extension.
    """
    ext = file_path.split('.')[-1].lower() if '.' in file_path else ""
    if ext == 'py':
        return 'python'
    elif ext in ('js', 'jsx'):
        return 'javascript'
    elif ext == 'ts':
        return 'typescript'
    elif ext == 'tsx':
        return 'tsx'
    return 'unknown'

def is_excluded_file(file_path: str, content: str) -> bool:
    """
    Checks if a file should be excluded from chunking, embedding, and AI summary.
    Excludes lockfiles, minified files, and files larger than 200KB.
    """
    if not file_path:
        return False
        
    filename = os.path.basename(file_path).lower()
    
    # 1. Check lockfile patterns
    lockfiles = {
        "package-lock.json",
        "yarn.lock",
        "pnpm-lock.yaml",
        "gemfile.lock",
        "poetry.lock",
        "composer.lock"
    }
    if filename in lockfiles:
        return True
        
    # 2. Check minified file patterns
    if filename.endswith(".min.js") or filename.endswith(".min.css"):
        return True
        
    # 3. Check file size (> 200KB)
    if content:
        # Encode content to bytes to get accurate file size in bytes
        content_size_bytes = len(content.encode("utf-8"))
        if content_size_bytes > 200 * 1024:
            return True
            
    return False

def get_language_parser(language: str):
    """
    Returns the Tree-Sitter Language object and Parser for the specified language.
    """
    if language == "python" and PY_LANGUAGE:
        return PY_LANGUAGE, Parser(PY_LANGUAGE)
    elif language == "javascript" and JS_LANGUAGE:
        return JS_LANGUAGE, Parser(JS_LANGUAGE)
    elif language == "typescript" and TS_LANGUAGE:
        return TS_LANGUAGE, Parser(TS_LANGUAGE)
    elif language == "tsx" and TSX_LANGUAGE:
        return TSX_LANGUAGE, Parser(TSX_LANGUAGE)
    return None, None

def get_node_name(node, content_bytes: bytes) -> str:
    """
    Attempts to retrieve the identifier/name of a class, function, or method node.
    """
    name_node = node.child_by_field_name('name')
    if name_node:
        return name_node.text.decode('utf-8', errors='ignore')
        
    # Fallback to scanning direct child nodes for identifier types
    for child in node.children:
        if child.type in ('identifier', 'property_identifier'):
            return child.text.decode('utf-8', errors='ignore')
            
    return "anonymous"

def create_chunk(node, chunk_type: str, content_bytes: bytes, name=None, parent_class=None) -> dict:
    """
    Creates a standardized chunk dict from a Tree-Sitter AST node.
    """
    start_line = node.start_point[0] + 1
    end_line = node.end_point[0] + 1
    
    # Extract raw content bytes and decode
    chunk_content = content_bytes[node.start_byte:node.end_byte].decode('utf-8', errors='ignore')
    
    if name is None:
        name = get_node_name(node, content_bytes)
        
    chunk = {
        "chunk_type": chunk_type,
        "name": name,
        "start_line": start_line,
        "end_line": end_line,
        "content": chunk_content
    }
    
    if parent_class:
        chunk["parent_class"] = parent_class
        
    return chunk

def flush_module_level(module_nodes: list, content_bytes: bytes, chunks: list) -> None:
    """
    Combines accumulated module-level nodes into a single consolidated module_level chunk.
    """
    if not module_nodes:
        return
        
    start_byte = module_nodes[0].start_byte
    end_byte = module_nodes[-1].end_byte
    
    start_line = module_nodes[0].start_point[0] + 1
    end_line = module_nodes[-1].end_point[0] + 1
    
    chunk_content = content_bytes[start_byte:end_byte].decode('utf-8', errors='ignore')
    
    # Avoid saving pure whitespace/new-line filler blocks
    if chunk_content.strip():
        chunks.append({
            "chunk_type": "module_level",
            "name": "module_level",
            "start_line": start_line,
            "end_line": end_line,
            "content": chunk_content
        })
    module_nodes.clear()

def naive_fallback_split(file_path: str, content: str) -> list[dict]:
    """
    Splits unsupported or unparsed files into naive text block chunks of 100 lines 
    with a 15-line overlap.
    """
    print(f"[DevLens AI Chunker Warning] Naive split fallback invoked for: {file_path}")
    
    lines = content.splitlines(keepends=True)
    total_lines = len(lines)
    chunks = []
    
    if total_lines == 0:
        return chunks
        
    chunk_size = 100
    overlap = 15
    
    start_idx = 0
    while start_idx < total_lines:
        end_idx = min(start_idx + chunk_size, total_lines)
        chunk_lines = lines[start_idx:end_idx]
        
        start_line = start_idx + 1
        end_line = end_idx
        
        chunk_content = "".join(chunk_lines)
        
        chunks.append({
            "chunk_type": "raw_split",
            "name": "raw_split",
            "start_line": start_line,
            "end_line": end_line,
            "content": chunk_content
        })
        
        if end_idx == total_lines:
            break
        start_idx += (chunk_size - overlap)
        
    return chunks

def chunk_file(file_path: str, content: str, language: str) -> list[dict]:
    """
    Parses file content into an AST and walks it to extract functions, classes, 
    methods, and module-level chunks. Falls back to naive line splitting if parsing fails.
    """
    lang_obj, parser = get_language_parser(language)
    
    if not parser:
        # Fallback to naive chunker if language is unsupported or SDK failed
        return naive_fallback_split(file_path, content)
        
    content_bytes = bytes(content, "utf-8")
    
    try:
        tree = parser.parse(content_bytes)
        root_node = tree.root_node
        
        if root_node.has_error:
            print(f"[DevLens AI Chunker Warning] AST contains syntax errors for: {file_path}. Falling back.")
            return naive_fallback_split(file_path, content)
            
        chunks = []
        module_nodes = []
        
        # Traverse top-level children of the program/module root
        for child in root_node.children:
            
            # Identify Python structures
            is_py_func = (language == "python" and child.type == "function_definition")
            is_py_class = (language == "python" and child.type == "class_definition")
            
            # Identify JS/TS structures
            is_js_func = (language in ("javascript", "typescript", "tsx") and child.type in ("function_declaration", "generator_function_declaration"))
            is_js_class = (language in ("javascript", "typescript", "tsx") and child.type == "class_declaration")
            
            # Scan lexical declarations for arrow function constants
            is_arrow_func = False
            arrow_func_name = None
            if language in ("javascript", "typescript", "tsx") and child.type == "lexical_declaration":
                for decl in child.children:
                    if decl.type == "variable_declarator":
                        for sub in decl.children:
                            if sub.type == "arrow_function":
                                is_arrow_func = True
                                arrow_func_name = get_node_name(decl, content_bytes)
                                break
                        if is_arrow_func:
                            break
            
            # If we encountered a major function/class structural element
            if is_py_func or is_py_class or is_js_func or is_js_class or is_arrow_func:
                # Flush consolidated imports/constants prior to this node
                flush_module_level(module_nodes, content_bytes, chunks)
                
                if is_py_class or is_js_class:
                    class_name = get_node_name(child, content_bytes)
                    class_chunk = create_chunk(child, "class", content_bytes, name=class_name)
                    chunks.append(class_chunk)
                    
                    # Extract internal methods
                    if is_py_class:
                        def extract_py_methods(node):
                            for sub_child in node.children:
                                if sub_child.type == "function_definition":
                                    method_chunk = create_chunk(sub_child, "method", content_bytes, parent_class=class_name)
                                    chunks.append(method_chunk)
                                else:
                                    extract_py_methods(sub_child)
                                    
                        body_node = child.child_by_field_name("body")
                        if body_node:
                            extract_py_methods(body_node)
                        else:
                            extract_py_methods(child)
                            
                    elif is_js_class:
                        body_node = child.child_by_field_name("body")
                        if body_node:
                            for sub_child in body_node.children:
                                if sub_child.type == "method_definition":
                                    method_chunk = create_chunk(sub_child, "method", content_bytes, parent_class=class_name)
                                    chunks.append(method_chunk)
                                    
                elif is_py_func or is_js_func:
                    func_chunk = create_chunk(child, "function", content_bytes)
                    chunks.append(func_chunk)
                    
                elif is_arrow_func:
                    func_chunk = create_chunk(child, "function", content_bytes, name=arrow_func_name)
                    chunks.append(func_chunk)
            else:
                # Accumulate non-class/non-function nodes for module_level chunk
                module_nodes.append(child)
                
        # Flush trailing module elements
        flush_module_level(module_nodes, content_bytes, chunks)
        return chunks
        
    except Exception as e:
        print(f"[DevLens AI Chunker Error] Failed to parse AST for {file_path}: {str(e)}")
        return naive_fallback_split(file_path, content)

def process_repo_chunks(repo_id: str) -> list[dict]:
    """
    Retrieves all file contents for a given repository and processes them into chunks.
    """
    if supabase is None:
        print("[DevLens AI Error] Supabase is not initialized. Cannot retrieve contents for chunking.")
        return []
        
    try:
        response = supabase.table("file_contents")\
            .select("file_path, content")\
            .eq("repo_id", repo_id)\
            .execute()
    except Exception as e:
        print(f"[DevLens AI Error] Failed to retrieve files from database: {str(e)}")
        return []
        
    all_chunks = []
    if not response.data:
        print(f"[DevLens AI] No cached file contents found for repo ID: {repo_id}")
        return all_chunks
        
    for row in response.data:
        file_path = row["file_path"]
        content = row["content"]
        
        if is_excluded_file(file_path, content):
            continue
            
        language = detect_language(file_path)
        file_chunks = chunk_file(file_path, content, language)
        
        for chunk in file_chunks:
            chunk["repo_id"] = repo_id
            chunk["file_path"] = file_path
            all_chunks.append(chunk)
            
    return all_chunks

def index_repo(repo_id: str, force_reindex: bool = False) -> dict:
    """
    Orchestrates repository indexing:
    1. Chunks files
    2. Batch-embeds text
    3. Uploads vectors to pgvector Supabase tables
    """
    if supabase is None:
        raise ValueError("Supabase is not initialized.")
        
    # Check for existing records if reindexing is not forced
    if not force_reindex:
        try:
            existing = supabase.table("code_chunks")\
                .select("file_path")\
                .eq("repo_id", repo_id)\
                .execute()
            if existing.data and len(existing.data) > 0:
                unique_files = len(set(row["file_path"] for row in existing.data))
                return {
                    "chunks_indexed": len(existing.data),
                    "files_processed": unique_files,
                    "message": "Repository indexing skipped: already indexed. Use force_reindex=True to overwrite."
                }
        except Exception as e:
            print(f"[DevLens AI Setup Warning] Idempotency check failed: {str(e)}")
            
    # Process code chunking
    chunks = process_repo_chunks(repo_id)
    if not chunks:
        return {
            "chunks_indexed": 0,
            "files_processed": 0,
            "message": "No files found to index."
        }
        
    # Generate embeddings in batch
    try:
        chunks = embed_chunks_batch(chunks)
    except Exception as e:
        print(f"[DevLens AI Error] Failed to generate embeddings for repository chunks: {str(e)}")
        raise e
        
    # Clear existing vectors to allow overwrite
    try:
        supabase.table("code_chunks").delete().eq("repo_id", repo_id).execute()
    except Exception as e:
        print(f"[DevLens AI Error] Failed to delete existing chunks for repository overwrite: {str(e)}")
        raise e
        
    # Prepare records and save in database (bulk inserts in batches of 100)
    records = []
    for chunk in chunks:
        records.append({
            "repo_id": repo_id,
            "file_path": chunk["file_path"],
            "chunk_type": chunk["chunk_type"],
            "name": chunk["name"],
            "parent_class": chunk.get("parent_class"),
            "start_line": chunk["start_line"],
            "end_line": chunk["end_line"],
            "content": chunk["content"],
            "embedding": chunk["embedding"]
        })
        
    # Chunked uploads to avoid DB constraints
    chunk_size = 100
    for i in range(0, len(records), chunk_size):
        batch = records[i:i + chunk_size]
        try:
            supabase.table("code_chunks").insert(batch).execute()
        except Exception as e:
            print(f"[DevLens AI Error] Failed to insert embedded batch to code_chunks: {str(e)}")
            raise e
            
    unique_files_count = len(set(chunk["file_path"] for chunk in chunks))
    print(f"[DevLens AI] Semantic Indexing complete. Indexed {len(records)} chunks across {unique_files_count} files for repo ID: {repo_id}")
    
    return {
        "chunks_indexed": len(records),
        "files_processed": unique_files_count,
        "message": "Semantic indexing completed successfully."
    }
