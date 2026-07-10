import os
import shutil
import stat

def _remove_readonly(func, path, excinfo):
    """
    Error handler for shutil.rmtree on Windows.
    If file removal fails due to permission errors (e.g. read-only Git objects),
    this handler clears the read-only attribute and retries the deletion.
    """
    try:
        os.chmod(path, stat.S_IWRITE)
        func(path)
    except Exception:
        # If still failing, ignore so the rmtree walk can proceed if possible
        pass

def cleanup_repo(local_path: str) -> None:
    """
    Safely deletes the temporary cloned repository folder.
    Clears any file permission restrictions before deletion.
    """
    if not local_path or not os.path.exists(local_path):
        return
        
    # Double check that we are not accidentally deleting a critical system path or workspace root
    normalized_path = os.path.abspath(local_path)
    # The temp path should contain "devlens_" and be inside a temp directory structure
    if "devlens_" in os.path.basename(normalized_path) or "temp" in normalized_path.lower():
        try:
            shutil.rmtree(normalized_path, onerror=_remove_readonly)
            print(f"[DevLens AI] Cleanup completed for: {normalized_path}")
        except Exception as e:
            # Last resort fallback ignoring errors
            print(f"[DevLens AI] Warning: Standard cleanup failed, attempting forced cleanup: {e}")
            shutil.rmtree(normalized_path, ignore_errors=True)
    else:
        print(f"[DevLens AI] Aborting cleanup: Path '{normalized_path}' does not look like a temporary repository clone.")
