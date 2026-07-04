"""
importer.py — PackageImporter

Creates an UploadTask from a validated package.

Constraints (locked per Stage 3.5.2-R1):
  - metadata_source is always RENDERER for Watch Folder imports
  - status is always WATCHED (engine never auto-approves)
  - title comes from metadata.title_final verbatim
  - video_id is always populated (validator guarantees this)
  - No Gemini calls. No file writes. No filesystem modifications.

Transaction safety:
  The INSERT is wrapped in a DB transaction.
  On any error the transaction is rolled back — no orphan tasks created.
  The folder will be re-evaluated on the next scan cycle.
"""

import uuid
import logging
from datetime import datetime

from sqlalchemy.orm import Session
from models import Account, UploadTask
from services.watch_folder.validator import ValidationResult

logger = logging.getLogger("watch_folder.importer")


def create_task(
    result: ValidationResult,
    account: Account,
    db: Session,
    p_key: str = None,
    p_config: dict = None,
    today_intake: int = 0,
) -> UploadTask:
    """
    Create an UploadTask from a successfully validated package.

    Args:
        result:  Populated ValidationResult from PackageValidator.
        account: The Account that owns the watch folder.
        db:      Active SQLAlchemy session.
        p_key:   Pipeline type (e.g. 'long', 'shorts')
        p_config: Pipeline configuration dictionary

    Returns:
        The created UploadTask (committed, refreshed).

    Raises:
        Exception: On DB error — transaction is rolled back before raising.
    """
    
    # Phase 6 & 13: Fallback to long if not specified
    pipeline_type = p_key if p_key else "long"
    
    # Fallback configs if none provided (for legacy mapping compatibility)
    if not p_config:
        p_config = {
            "schedule_mode": "application",
            "schedule": ["09:00"],
            "humanize": {"enabled": False, "min_delay_minutes": 0, "max_delay_minutes": 0}
        }
        
    schedule_list = p_config.get("schedule", ["09:00"])
    if not isinstance(schedule_list, list) or len(schedule_list) == 0:
        schedule_list = ["09:00"]
    
    assigned_schedule_time = str(schedule_list[today_intake % len(schedule_list)])
    import json
    
    defaults_json = {}
    advanced_json = {}
    if account.upload_defaults:
        try:
            defaults_json = json.loads(account.upload_defaults)
        except Exception:
            pass
    if account.advanced_settings:
        try:
            advanced_json = json.loads(account.advanced_settings)
        except Exception:
            pass

    p_defaults = defaults_json.get(pipeline_type, {}).get("basic_info", {})
    p_advanced = defaults_json.get(pipeline_type, {}).get("advanced", {})

    final_title = result.title
    if not final_title and p_defaults.get("title_template"): final_title = p_defaults.get("title_template")
    
    final_desc = result.description
    if not final_desc and p_defaults.get("description"): final_desc = p_defaults.get("description")
    
    final_tags = result.tags
    if isinstance(final_tags, list):
        final_tags = ", ".join(str(t) for t in final_tags)
    if not final_tags and p_defaults.get("tags"): final_tags = p_defaults.get("tags")
    
    final_privacy = result.privacy_status
    if (not final_privacy or final_privacy == "private") and p_defaults.get("visibility"):
        final_privacy = p_defaults.get("visibility")
    if not final_privacy:
        final_privacy = "private"
        
    final_category = result.category
    if not final_category and p_defaults.get("category"): final_category = p_defaults.get("category")
    if not final_category and account.category: final_category = account.category
    final_category_id = int(final_category) if final_category and str(final_category).isdigit() else 22
    
    final_playlist = result.playlist_id
    if not final_playlist and p_defaults.get("playlist"): final_playlist = p_defaults.get("playlist")

    final_audience = "kids" if (result.made_for_kids or result.self_declared_made_for_kids) else None
    if not final_audience and p_defaults.get("audience"): final_audience = p_defaults.get("audience")
    final_made_for_kids = True if final_audience == "kids" else False

    final_ai_use = result.ai_use if result.ai_use else "UNKNOWN"
    if p_defaults.get("ai_generated") is not None:
        final_ai_use = "YES" if p_defaults.get("ai_generated") else "NO"
        
    final_license = result.license
    if not final_license and p_defaults.get("license"): final_license = p_defaults.get("license")
    
    final_lang = result.default_language if result.default_language else result.language
    if not final_lang and p_defaults.get("language"): final_lang = p_defaults.get("language")

    final_audio_lang = result.audio_language if result.audio_language else result.language
    if not final_audio_lang and p_defaults.get("language"): final_audio_lang = p_defaults.get("language")

    final_notify = result.notify_subscribers if result.notify_subscribers is not None else True
    if p_advanced.get("notify_subscribers") is not None: final_notify = p_advanced.get("notify_subscribers")
    
    final_embeddable = result.embeddable if result.embeddable is not None else True
    if p_advanced.get("embeddable") is not None: final_embeddable = p_advanced.get("embeddable")

    final_public_stats = result.public_stats_viewable if result.public_stats_viewable is not None else True
    if p_advanced.get("public_stats_viewable") is not None: final_public_stats = p_advanced.get("public_stats_viewable")

    task = UploadTask(
        id=str(uuid.uuid4()),

        account_id=account.id,
        profile_id=account.profile_id,  # Inherited from account — nullable

        # State (Architecture Rule 2: must keep existing initial state -> WATCHED)
        status="WATCHED",
        metadata_source="RENDERER",           # Always RENDERER for Watch Folder imports
        source_type=account.source_type,      # M1_VIDEO_SPLITTER or M3_PLAYLIST_BUILDER

        # Package paths
        package_folder=result.package_folder,
        video_path=result.video_path,
        thumbnail_path=result.thumbnail_path,     # None if thumbnail.jpg absent
        metadata_path=result.metadata_path,
        timestamps_path=result.timestamps_path,   # None if timestamps.txt absent

        # Metadata snapshot (immutable at import time)
        title=final_title,
        description=final_desc,
        tags=final_tags,
        privacy_status=final_privacy,
        made_for_kids=final_made_for_kids,
        video_id=result.video_id,
        
        # Extended YouTube API Metadata
        playlist_id=final_playlist,
        playlist_title=result.playlist_title,
        category_id=final_category_id,
        ai_use=final_ai_use,
        default_language=final_lang,
        audio_language=final_audio_lang,
        license=final_license,
        audience=final_audience,
        notify_subscribers=final_notify,
        embeddable=final_embeddable,
        public_stats_viewable=final_public_stats,

        # Timestamps
        created_at=datetime.utcnow(),
        scheduled_at=None,
        recording_date=datetime.fromisoformat(result.recording_date.replace("Z", "+00:00")).replace(tzinfo=None) if result.recording_date else None,
        
        # Scheduling Metadata (Phase 5)
        pipeline_type=pipeline_type,
        schedule_mode=p_config.get("schedule_mode", "application"),
        schedule_time=assigned_schedule_time,
        humanize_enabled=p_config.get("humanize", {}).get("enabled", False),
        humanize_min=int(p_config.get("humanize", {}).get("min_delay_minutes", 0)),
        humanize_max=int(p_config.get("humanize", {}).get("max_delay_minutes", 0)),
        
        # Sprint 10.5 Metadata Automation
        upload_mode=p_config.get("upload_mode", "Waiting For Approval"),
        ai_metadata_generated=False if p_config.get("ai_metadata_enabled", False) else True,
    )

    try:
        db.add(task)
        db.commit()
        db.refresh(task)

        logger.info(
            f"[IMPORTER] Task created | "
            f"task_id={task.id} | "
            f"video_id={task.video_id!r} | "
            f"title={task.title!r} | "
            f"account={account.channel_name!r} | "
            f"folder={result.package_folder!r} | "
            f"pipeline={pipeline_type}"
        )
        return task

    except Exception as e:
        db.rollback()
        logger.error(
            f"[IMPORTER] DB error — transaction rolled back | "
            f"folder={result.package_folder!r} | error={e}"
        )
        raise

