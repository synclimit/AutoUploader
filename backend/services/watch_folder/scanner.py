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

# Minimum age (seconds) of all files in a folder before it is considered stable.
STABILITY_WINDOW_SECONDS = 3


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
    if not watch_folder_path or not watch_folder_path.strip():
        return [], True  # No path configured — silently do nothing

    candidates = []
    seen_paths = set()

    try:
        for root, dirs, files in os.walk(watch_folder_path):
            dirs[:] = [d for d in dirs if not d.startswith((".", "_")) and not d.lower().endswith((".ignored", ".deleted"))]
            
            # 1. If folder has metadata.json, treat the directory as a package
            if "metadata.json" in files:
                if root not in seen_paths and _is_stable(root):
                    try:
                        mtime = os.stat(root).st_mtime
                    except OSError:
                        mtime = 0
                    candidates.append({"path": root, "mtime": mtime})
                    seen_paths.add(root)
                    dirs[:] = []
                    continue

            # 2. Add individual video files
            for f in files:
                if f.startswith((".", "_")) or f.lower().endswith((".ignored", ".deleted")):
                    continue
                if f.lower().endswith((".mp4", ".mov", ".mkv")):
                    full_path = os.path.join(root, f)
                    if full_path not in seen_paths and _is_stable(full_path):
                        try:
                            mtime = os.stat(full_path).st_mtime
                        except OSError:
                            mtime = 0
                        candidates.append({"path": full_path, "mtime": mtime})
                        seen_paths.add(full_path)
    except (OSError, PermissionError) as e:
        logger.error(f"[SCANNER] Cannot access watch folder: {watch_folder_path!r} — {e}")
        return [], False

    return candidates, True


def _is_stable(path: str) -> bool:
    """
    Returns True if the path (file or directory) has not been modified within STABILITY_WINDOW_SECONDS.
    A folder with no files is considered stable.
    """
    now = time.time()
    cutoff = now - STABILITY_WINDOW_SECONDS

    try:
        if os.path.isfile(path):
            try:
                mtime = os.stat(path).st_mtime
                if mtime > cutoff:
                    return False
            except OSError:
                return False  # Disappeared or inaccessible mid-scan
            return True

        for entry in os.scandir(path):
            try:
                mtime = entry.stat(follow_symlinks=False).st_mtime
                if mtime > cutoff:
                    return False  # File was recently written — folder is not stable
            except OSError:
                pass  # File disappeared mid-scan — ignore
    except (OSError, PermissionError):
        return False  # Cannot read folder or file — treat as unstable

    return True
