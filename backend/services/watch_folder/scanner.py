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

    try:
        entries = list(os.scandir(watch_folder_path))
    except (OSError, PermissionError) as e:
        logger.error(f"[SCANNER] Cannot access watch folder: {watch_folder_path!r} — {e}")
        return [], False  # Signal ERROR state to engine

    candidates = []

    for entry in entries:
        if entry.name.startswith(".") or entry.name.startswith("_") or entry.name.lower().endswith(".ignored") or entry.name.lower().endswith(".deleted"):
            continue
        if entry.is_dir(follow_symlinks=False):
            candidate_path = entry.path
        elif entry.is_file(follow_symlinks=False) and entry.name.lower().endswith(".mp4"):
            candidate_path = entry.path
        else:
            continue

        if _is_stable(candidate_path):
            try:
                mtime = os.stat(candidate_path).st_mtime
            except OSError:
                mtime = 0
            candidates.append({"path": candidate_path, "mtime": mtime})
        else:
            logger.debug(f"[SCANNER] INVALID_VIDEO_COPYING (still writing): {candidate_path!r} — deferred")

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
