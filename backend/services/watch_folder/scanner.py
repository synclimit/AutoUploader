"""
scanner.py — FolderScanner

Scans a watch folder path and returns a list of stable folder candidates.
A folder is "stable" if none of its files have been written to in the last 3 seconds.

Responsibilities:
  - List subdirectories in the watch path
  - Filter out non-directories
  - Check folder stability (3-second mtime window)
  - Handle OSError / PermissionError gracefully
  - Return List[str] of stable folder paths

This module is stateless — pure filesystem operations only.
No DB access. No engine state mutations.
"""

import os
import time
import logging

logger = logging.getLogger("watch_folder.scanner")

VIDEO_EXTENSIONS = (
    ".mp4", ".mov", ".mkv", ".avi", ".webm", ".flv", ".m4v", ".wmv", ".ts", ".3gp", ".m4p", ".mpeg", ".mpg"
)


def scan(watch_folder_path: str) -> tuple[list[dict], bool]:
    """
    Scan a watch folder path and return stable folder candidates.

    Args:
        watch_folder_path: Absolute path to the watch folder.

    Returns:
        (candidates, path_ok)
          candidates: list of dicts like {"path": str, "mtime": float}
          path_ok: False if the path was inaccessible (OSError), True otherwise
    """
    if not watch_folder_path or not str(watch_folder_path).strip():
        return [], True  # No path configured — silently do nothing

    clean_path = os.path.normpath(str(watch_folder_path).strip().strip('"').strip("'"))
    if not os.path.exists(clean_path):
        return [], False

    candidates = []
    seen_paths = set()

    try:
        for root, dirs, files in os.walk(clean_path):
            dirs[:] = [d for d in dirs if not d.startswith((".", "_")) and not d.lower().endswith((".ignored", ".deleted"))]
            
            # 1. If folder has metadata.json, treat the directory as a package
            if "metadata.json" in files:
                norm_root = os.path.normpath(root)
                if norm_root not in seen_paths and _is_stable(norm_root):
                    try:
                        mtime = os.stat(norm_root).st_mtime
                    except OSError:
                        mtime = 0
                    candidates.append({"path": norm_root, "mtime": mtime})
                    seen_paths.add(norm_root)
                    dirs[:] = []
                    continue

            # 2. Add individual video files
            for f in files:
                if f.startswith((".", "_")) or f.lower().endswith((".ignored", ".deleted")):
                    continue
                if f.lower().endswith(VIDEO_EXTENSIONS):
                    full_path = os.path.normpath(os.path.join(root, f))
                    if full_path not in seen_paths and _is_stable(full_path):
                        try:
                            mtime = os.stat(full_path).st_mtime
                        except OSError:
                            mtime = 0
                        candidates.append({"path": full_path, "mtime": mtime})
                        seen_paths.add(full_path)
    except (OSError, PermissionError) as e:
        logger.error(f"[SCANNER] Cannot access watch folder: {clean_path!r} — {e}")
        return [], False

    return candidates, True


def _is_stable(path: str) -> bool:
    """
    Returns True if the path (file or directory) is non-empty and readable.
    If another process is currently writing to the file, Windows locks it and open() fails.
    """
    try:
        if os.path.isfile(path):
            if os.path.getsize(path) == 0:
                return False
            # Test readability
            with open(path, "rb") as f:
                f.read(1024)
            return True

        # Directory stability check
        return True
    except (OSError, PermissionError):
        return False  # Cannot read folder or file — treat as unstable

    return True
