import os

EXCLUDED_FOLDERS = {
    "node_modules", ".git", "dist", "build", "__pycache__", 
    "venv", ".venv", ".pytest_cache", ".idea", ".vscode"
}

# Keep common configuration dotfiles while filtering out other dotfiles
ALLOWED_DOTFILES = {
    ".gitignore", ".eslintrc", ".prettierrc", ".babelrc", 
    ".env.example" # User noted .env.example is fine to exclude, but let's allow common safe config metadata if they exist
}

BINARY_EXTENSIONS = {
    # Images
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp", ".bmp", ".tiff",
    # Audio/Video
    ".mp3", ".wav", ".flac", ".ogg", ".mp4", ".mov", ".avi", ".mkv", ".webm",
    # Fonts
    ".ttf", ".otf", ".woff", ".woff2", ".eot",
    # Archives
    ".zip", ".tar", ".gz", ".rar", ".7z",
    # Document types & executable code
    ".pdf", ".exe", ".dll", ".so", ".dylib", ".pyc", ".pyo", ".class", ".o"
}

MAX_FILE_SIZE_BYTES = 500 * 1024  # 500KB

def build_file_tree(root_path: str) -> dict:
    """
    Walks the cloned repository directory and returns a nested tree structure.
    Filters out noise folders, dotfiles, binary files, and files larger than 500KB.
    Paths are returned as relative to the root_path with normalized forward slashes.
    """
    def _build_node(current_path: str) -> dict | None:
        name = os.path.basename(current_path)

        # If it is a directory
        if os.path.isdir(current_path):
            # Check exclusions
            if name in EXCLUDED_FOLDERS:
                return None
            if name.startswith('.') and name not in ALLOWED_DOTFILES:
                return None

            try:
                # Retrieve children sorted alphabetically (directories first, then files)
                dir_contents = os.listdir(current_path)
            except OSError:
                return None

            # Sort items so that directories appear first, then files, both alphabetically
            folders = []
            files = []
            for item in dir_contents:
                item_path = os.path.join(current_path, item)
                if os.path.isdir(item_path):
                    folders.append(item)
                else:
                    files.append(item)
            
            sorted_items = sorted(folders) + sorted(files)

            children = []
            for item in sorted_items:
                child_path = os.path.join(current_path, item)
                child_node = _build_node(child_path)
                if child_node:
                    children.append(child_node)

            # Compute relative path
            rel_path = os.path.relpath(current_path, root_path)
            # Normalize paths to use forward slashes for frontend cross-compatibility
            rel_path_normalized = rel_path.replace(os.path.sep, '/')
            if rel_path_normalized == '.':
                rel_path_normalized = ""

            return {
                "name": name,
                "path": rel_path_normalized,
                "type": "folder",
                "children": children
            }

        # If it is a file
        else:
            # Exclude dotfiles unless explicitly allowed
            if name.startswith('.') and name not in ALLOWED_DOTFILES:
                return None

            # Exclude binaries & media
            _, ext = os.path.splitext(name)
            if ext.lower() in BINARY_EXTENSIONS:
                return None

            # Exclude large files
            try:
                if os.path.getsize(current_path) > MAX_FILE_SIZE_BYTES:
                    return None
            except OSError:
                return None

            rel_path = os.path.relpath(current_path, root_path)
            rel_path_normalized = rel_path.replace(os.path.sep, '/')

            return {
                "name": name,
                "path": rel_path_normalized,
                "type": "file"
            }

    # Run recursion
    tree = _build_node(root_path)
    if tree is None:
        return {}
    return tree
