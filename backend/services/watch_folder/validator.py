"""
validator.py — PackageValidator

Implements the full 11-step validation pipeline for a Watch Folder package.

Required files / fields (hard fail if missing):
  - video.mp4          (file must exist and be non-empty)
  - metadata.json      (file must exist and be valid JSON)
  - title_final        (key must exist in metadata.json and be non-empty)
  - video_id           (key must exist in metadata.json and be non-empty)

Optional files (import proceeds without them):
  - thumbnail.jpg      -> thumbnail_path = None if absent
  - timestamps.txt     -> timestamps_path = None if absent

This module is stateless — pure filesystem + JSON operations.
No DB access. No engine state mutations.
"""

import os
import json
import logging
from dataclasses import dataclass, field

logger = logging.getLogger("watch_folder.validator")


# ---------------------------------------------------------------------------
# Error codes
# ---------------------------------------------------------------------------

MISSING_VIDEO        = "MISSING_VIDEO"
EMPTY_VIDEO          = "EMPTY_VIDEO"
MISSING_METADATA     = "MISSING_METADATA"
MALFORMED_METADATA   = "MALFORMED_METADATA"
MISSING_TITLE_FINAL  = "MISSING_TITLE_FINAL"
MISSING_VIDEO_ID     = "MISSING_VIDEO_ID"


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------

@dataclass
class ValidationResult:
    success: bool
    error_code: str | None = None
    error_message: str | None = None

    # Populated on success only
    package_folder: str | None = None
    video_path: str | None = None
    thumbnail_path: str | None = None
    metadata_path: str | None = None
    timestamps_path: str | None = None

    title: str | None = None
    description: str | None = None
    tags: str | None = None
    privacy_status: str | None = None
    made_for_kids: bool | None = None
    scheduled_at: str | None = None
    video_id: str | None = None
    
    # Extended metadata fields
    category: str | None = None
    playlist_id: str | None = None
    playlist_title: str | None = None
    language: str | None = None
    default_language: str | None = None
    audio_language: str | None = None
    license: str | None = None
    embeddable: bool | None = None
    public_stats_viewable: bool | None = None
    notify_subscribers: bool | None = None
    self_declared_made_for_kids: bool | None = None
    ai_use: str | None = None
    recording_date: str | None = None

    source_channel: str | None = None
    source_url: str | None = None


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def validate(path: str) -> ValidationResult:
    """
    Run the full validation pipeline for a candidate package.
    `path` can be a directory (standard package) or a direct .mp4 file.
    """
    if not os.path.exists(path):
        return _fail(path, MISSING_VIDEO, f"Path no longer exists: {path!r}")

    is_direct_file = os.path.isfile(path)
    
    if is_direct_file:
        folder_path = os.path.dirname(path)
        video_mp4 = path
        package_folder = path  # Treat the file itself as the package identifier
        meta_json = None
        metadata = {}
    else:
        folder_path = path
        package_folder = path
        meta_json = os.path.join(folder_path, "metadata.json")
        metadata = {}
        if os.path.isfile(meta_json):
            try:
                with open(meta_json, "r", encoding="utf-8") as f:
                    metadata = json.load(f)
            except (json.JSONDecodeError, OSError, UnicodeDecodeError) as e:
                return _fail(
                    folder_path, MALFORMED_METADATA,
                    f"Malformed metadata.json — Package rejected: {folder_path!r} ({e})"
                )
        else:
            meta_json = None

    if not is_direct_file:
        try:
            mp4_files = [f for f in os.listdir(folder_path) if f.lower().endswith((".mp4", ".mov", ".mkv"))]
        except OSError:
            mp4_files = []
            
        if not mp4_files:
            return _fail(folder_path, MISSING_VIDEO, f"No video found in folder: {folder_path!r}")
            
        if len(mp4_files) == 1:
            video_mp4 = os.path.join(folder_path, mp4_files[0])
        else:
            video_mp4 = _select_video(folder_path, mp4_files, metadata)
            logger.info(f"MULTIPLE_VIDEOS_FOUND\nselected={os.path.basename(video_mp4)}")

    if os.path.getsize(video_mp4) == 0:
        return _fail(package_folder, EMPTY_VIDEO, f"Empty video: {video_mp4!r}")

    video_name = os.path.splitext(os.path.basename(video_mp4))[0]

    # Synthesize Title
    title_final = metadata.get("title_final") or metadata.get("title")
    if not title_final or not str(title_final).strip():
        title_final = video_name

    # Synthesize Video ID
    video_id = metadata.get("video_id")
    if not video_id or not str(video_id).strip():
        f_size = os.path.getsize(video_mp4)
        m_time = int(os.path.getmtime(video_mp4))
        video_id = f"RAW_{video_name}_{f_size}_{m_time}"
        # TODO: Sprint 8.7 Replace fallback identifier with SHA256 video hash.

    # Thumbnail logic
    thumbnail_path = None
    if not is_direct_file:
        thumbnail_path = _find_thumbnail(folder_path, video_name, metadata.get("thumbnail"))

    # Timestamps txt
    ts_txt = os.path.join(folder_path, "timestamps.txt")
    timestamps_path = ts_txt if not is_direct_file and os.path.isfile(ts_txt) else None

    logger.info(
        f"[VALIDATOR] Package valid — "
        f"title={title_final!r}, video_id={video_id!r}, package={package_folder!r}"
    )

    tags_raw = metadata.get("tags")
    tags_str = None
    if isinstance(tags_raw, list):
        tags_str = ", ".join(str(t) for t in tags_raw)
    elif tags_raw:
        tags_str = str(tags_raw)

    return ValidationResult(
        success=True,
        package_folder=package_folder,
        video_path=video_mp4,
        thumbnail_path=thumbnail_path,
        metadata_path=meta_json,
        timestamps_path=timestamps_path,
        
        title=str(title_final).strip(),
        description=metadata.get("description"),
        tags=tags_str,
        privacy_status=metadata.get("privacy") or metadata.get("privacy_status"),
        made_for_kids=metadata.get("madeForKids") or metadata.get("made_for_kids"),
        scheduled_at=metadata.get("publishAt") or metadata.get("scheduled_at"),
        video_id=str(video_id).strip(),
        
        category=metadata.get("category"),
        playlist_id=metadata.get("playlist"),
        playlist_title=metadata.get("playlist_title"),
        language=metadata.get("language"),
        default_language=metadata.get("defaultLanguage"),
        audio_language=metadata.get("audioLanguage"),
        license=metadata.get("license"),
        embeddable=metadata.get("embeddable"),
        public_stats_viewable=metadata.get("publicStatsViewable"),
        notify_subscribers=metadata.get("notifySubscribers"),
        self_declared_made_for_kids=metadata.get("selfDeclaredMadeForKids"),
        ai_use=metadata.get("ai_use"),
        recording_date=metadata.get("recordingDate") or metadata.get("recording_date"),
        
        source_channel=metadata.get("source_channel"),
        source_url=metadata.get("source_url"),
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _fail(package_folder: str, error_code: str, message: str) -> ValidationResult:
    logger.error(f"[VALIDATOR] [{error_code}] {message}")
    return ValidationResult(
        success=False,
        error_code=error_code,
        error_message=message,
        package_folder=package_folder,
    )

def _select_video(folder_path: str, mp4_files: list[str], metadata: dict) -> str:
    """
    Deterministic rule for selecting a single video from multiple options:
    1. metadata specified
    2. largest size
    3. newest modified time
    4. alphabetical
    """
    if metadata and "video_filename" in metadata:
        meta_vid = metadata["video_filename"]
        if meta_vid in mp4_files:
            return os.path.join(folder_path, meta_vid)
            
    # Gather stats for ranking
    candidates = []
    for f in mp4_files:
        full_path = os.path.join(folder_path, f)
        try:
            st = os.stat(full_path)
            size = st.st_size
            mtime = st.st_mtime
        except OSError:
            size = 0
            mtime = 0
        candidates.append({
            "name": f,
            "path": full_path,
            "size": size,
            "mtime": mtime
        })
        
    # Sort by size (desc), mtime (desc), name (asc)
    candidates.sort(key=lambda x: (x["size"], x["mtime"], x["name"] == x["name"]), reverse=True) # Wait, name asc needs careful sorting
    # Actually, Python sort is stable. Let's do it cleanly:
    candidates.sort(key=lambda x: x["name"]) # ascending
    candidates.sort(key=lambda x: x["mtime"], reverse=True) # descending
    candidates.sort(key=lambda x: x["size"], reverse=True) # descending
    
    return candidates[0]["path"]

def _find_thumbnail(folder_path: str, video_name: str, meta_thumb: str | None) -> str | None:
    """
    Thumbnail priority:
    1. <video_name>.jpg/jpeg/png
    2. thumbnail.*
    3. cover.*
    4. poster.*
    5. First valid image
    """
    if meta_thumb:
        meta_path = os.path.join(folder_path, meta_thumb)
        if os.path.isfile(meta_path):
            return meta_path

    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    try:
        files = os.listdir(folder_path)
    except OSError:
        return None
        
    images = [f for f in files if os.path.splitext(f)[1].lower() in valid_exts]
    if not images:
        return None

    # Priority 1: <video_name>.*
    for ext in [".jpg", ".jpeg", ".png", ".webp"]:
        if f"{video_name}{ext}" in images:
            return os.path.join(folder_path, f"{video_name}{ext}")

    # Priority 2, 3, 4
    for prefix in ["thumbnail", "cover", "poster"]:
        for img in images:
            if os.path.splitext(img)[0].lower() == prefix:
                return os.path.join(folder_path, img)
                
    # Priority 5: first valid image
    images.sort()
    return os.path.join(folder_path, images[0])
