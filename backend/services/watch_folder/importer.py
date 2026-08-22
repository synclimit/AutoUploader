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
from models import Channel, UploadTask
from services.watch_folder.validator import ValidationResult

logger = logging.getLogger("watch_folder.importer")


def create_task(
    result: ValidationResult,
    channel: Channel,
    db: Session,
    p_key: str = None,
    p_config: dict = None,
    today_intake: int = 0,
) -> UploadTask:
    """
    Create an UploadTask from a successfully validated package.

    Args:
        result:  Populated ValidationResult from PackageValidator.
        channel: The Channel that owns the watch folder.
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
    
    if not isinstance(p_config, dict):
        p_config = {}
        
    schedule_list = p_config.get("schedule") or ["09:00"]
    if not isinstance(schedule_list, list) or len(schedule_list) == 0:
        schedule_list = ["09:00"]
    
    assigned_schedule_time = str(schedule_list[today_intake % len(schedule_list)])
    import json
    
    defaults_json = {}
    advanced_json = {}
    if channel.upload_defaults:
        try:
            defaults_json = json.loads(channel.upload_defaults) if isinstance(channel.upload_defaults, str) else channel.upload_defaults
            if not isinstance(defaults_json, dict):
                defaults_json = {}
        except Exception:
            defaults_json = {}
    if channel.advanced_settings:
        try:
            advanced_json = json.loads(channel.advanced_settings) if isinstance(channel.advanced_settings, str) else channel.advanced_settings
            if not isinstance(advanced_json, dict):
                advanced_json = {}
        except Exception:
            advanced_json = {}

    p_defaults = (defaults_json.get(pipeline_type) or {}).get("basic_info") or {}
    p_advanced = (defaults_json.get(pipeline_type) or {}).get("advanced") or {}
    if not isinstance(p_defaults, dict):
        p_defaults = {}
    if not isinstance(p_advanced, dict):
        p_advanced = {}

    final_title = result.title
    title_tpl = p_defaults.get("title_template")
    if title_tpl:
        if "{filename}" in title_tpl:
            final_title = title_tpl.replace("{filename}", result.title or "")
        else:
            final_title = title_tpl
    
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
    if final_category and not str(final_category).isdigit():
        final_category = None
        
    if not final_category and p_defaults.get("category"): final_category = p_defaults.get("category")
    if not final_category and channel.category: final_category = channel.category
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

    import os
    try:
        file_size = os.path.getsize(result.video_path) if result.video_path else 0
        file_name = os.path.basename(result.video_path) if result.video_path else ""
    except Exception:
        file_size = 0
        file_name = ""

    humanize_dict = p_config.get("humanize")
    if not isinstance(humanize_dict, dict):
        humanize_dict = {}
        
    humanize_enabled = bool(humanize_dict.get("enabled", False))
    try:
        humanize_min = int(humanize_dict.get("min_delay_minutes", 0) or 0)
    except (TypeError, ValueError):
        humanize_min = 0
    try:
        humanize_max = int(humanize_dict.get("max_delay_minutes", 0) or 0)
    except (TypeError, ValueError):
        humanize_max = 0

    rec_date = None
    if result.recording_date:
        try:
            rec_date = datetime.fromisoformat(str(result.recording_date).replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            try:
                rec_date = datetime.strptime(str(result.recording_date)[:10], "%Y-%m-%d")
            except Exception:
                rec_date = None

    # Calculate planned upload schedule (Date & Time)
    import pytz
    from datetime import timedelta, time

    automation_strategy = str(p_config.get("automation_strategy", "continuous")).lower()
    has_campaign = bool(automation_strategy == "campaign" or p_config.get("campaign_folder"))
    exec_source = "CAMPAIGN" if has_campaign else "CONTINUOUS"

    tz_str = getattr(channel, "publish_timezone", None) or "Asia/Jakarta"
    try:
        tz = pytz.timezone(tz_str)
    except Exception:
        tz = pytz.timezone("Asia/Jakarta")

    now_local = datetime.now(tz)
    try:
        daily_limit_val = int(p_config.get("daily_limit", 1) or 1)
    except Exception:
        daily_limit_val = 1
    if daily_limit_val <= 0:
        daily_limit_val = 1

    try:
        from schemas import QueueStatusEnum
        existing_task_count = db.query(UploadTask).filter(
            UploadTask.channel_id == channel.id,
            UploadTask.pipeline_type == pipeline_type,
            UploadTask.status.in_([QueueStatusEnum.watched, QueueStatusEnum.review, QueueStatusEnum.scheduled, QueueStatusEnum.queued])
        ).count()
    except Exception:
        existing_task_count = today_intake

    queue_index = existing_task_count

    try:
        first_parts = str(schedule_list[0]).split(":")
        first_h = int(first_parts[0])
        first_m = int(first_parts[1]) if len(first_parts) > 1 else 0
    except Exception:
        first_h = 9
        first_m = 0

    today_first_dt = tz.localize(datetime.combine(now_local.date(), time(first_h, first_m)))
    base_day_shift = 1 if today_first_dt <= now_local else 0

    day_offset = base_day_shift + (queue_index // daily_limit_val)
    slot_idx_in_day = queue_index % daily_limit_val

    if slot_idx_in_day < len(schedule_list):
        time_slot_str = str(schedule_list[slot_idx_in_day])
    else:
        start_hour = 9
        end_hour = 21
        step = (end_hour - start_hour) / max(1, daily_limit_val - 1)
        slot_h = int(start_hour + slot_idx_in_day * step)
        time_slot_str = f"{slot_h:02d}:00"

    try:
        parts = time_slot_str.split(":")
        slot_hour = int(parts[0])
        slot_minute = int(parts[1]) if len(parts) > 1 else 0
    except Exception:
        slot_hour = 9
        slot_minute = 0

    target_date = now_local.date() + timedelta(days=day_offset)
    target_dt_local = tz.localize(datetime.combine(target_date, time(slot_hour, slot_minute)))

    if humanize_enabled and humanize_min <= humanize_max and humanize_max > 0:
        import random
        jitter = random.randint(humanize_min, humanize_max)
        target_dt_local += timedelta(minutes=jitter)

    # Avoid same-minute collision with existing tasks on the same day for this channel
    try:
        from schemas import QueueStatusEnum
        day_start_utc = target_dt_local.replace(hour=0, minute=0, second=0, microsecond=0).astimezone(pytz.UTC).replace(tzinfo=None)
        day_end_utc = target_dt_local.replace(hour=23, minute=59, second=59, microsecond=999999).astimezone(pytz.UTC).replace(tzinfo=None)
        existing_tasks = db.query(UploadTask.schedule_time).filter(
            UploadTask.channel_id == channel.id,
            UploadTask.scheduled_at >= day_start_utc,
            UploadTask.scheduled_at <= day_end_utc
        ).all()
        used_times = {t[0] for t in existing_tasks if t[0]}
        import random
        while target_dt_local.strftime("%H:%M") in used_times:
            target_dt_local += timedelta(minutes=random.randint(3, 8))
    except Exception:
        pass

    calculated_scheduled_at = target_dt_local.astimezone(pytz.UTC).replace(tzinfo=None)

    task = UploadTask(
        id=str(uuid.uuid4()),

        channel_id=channel.id,
        account_id=channel.id,
        profile_id=channel.profile_id,  # Inherited from channel — nullable

        # State (Architecture Rule 2: must keep existing initial state -> WATCHED)
        status="WATCHED",
        metadata_source="RENDERER",           # Always RENDERER for Watch Folder imports
        source_type=channel.source_type if (channel.source_type and channel.source_type in ["M1_VIDEO_SPLITTER", "M3_PLAYLIST_BUILDER"]) else "M1_VIDEO_SPLITTER",
        execution_source=exec_source,

        # Package paths
        package_folder=result.package_folder,
        video_path=result.video_path,
        file_name=file_name,
        file_size=file_size,
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
        scheduled_at=calculated_scheduled_at,
        recording_date=rec_date,
        
        # Scheduling Metadata (Phase 5)
        pipeline_type=pipeline_type,
        schedule_mode=p_config.get("schedule_mode", "application"),
        schedule_time=target_dt_local.strftime("%H:%M"),
        humanize_enabled=humanize_enabled,
        humanize_min=humanize_min,
        humanize_max=humanize_max,
        
        # Sprint 10.5 Metadata Automation
        upload_mode="Auto Upload" if (
            p_config.get("require_approval") is False 
            or str(p_config.get("require_approval")).strip().lower() == "false" 
            or str(p_config.get("upload_mode", "")).strip().lower() in ["auto upload", "auto_upload", "auto"]
        ) else p_config.get("upload_mode", "Waiting For Approval"),
        ai_metadata_generated=False if p_config.get("ai_metadata_enabled", False) else True,
    )

    try:
        # Guarantee legacy accounts table has channel ID to satisfy any legacy SQLite FK constraints
        try:
            from sqlalchemy import text
            db.execute(
                text("INSERT OR IGNORE INTO accounts (id, channel_name) VALUES (:id, :name)"),
                {"id": channel.id, "name": getattr(channel, "alias_name", getattr(channel, "channel_name", "Channel"))}
            )
            db.flush()
        except Exception:
            pass

        db.add(task)
        db.commit()
        db.refresh(task)

        logger.info(
            f"[IMPORTER] Task created | "
            f"task_id={task.id} | "
            f"video_id={task.video_id!r} | "
            f"title={task.title!r} | "
            f"channel={channel.channel_name!r} | "
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

