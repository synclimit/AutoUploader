"""
duplicate_checker.py — DuplicateChecker

Checks whether a validated package has already been imported.

Strategy (Stage 3.5):
  Primary check:   video_id match in upload_tasks
  Secondary check: package_folder match in upload_tasks (rescan guard)

Duplicate behavior:
  Duplicate detected → Log warning → Skip → Continue scan
  No deferred queue. No user interaction. No approval workflow.

Special case for FAILED/CANCELLED:
  If a previous task with the same video_id has status FAILED or CANCELLED,
  it is safe to re-import (treated as a retry of a failed attempt).

TODO:
  - Add video hash duplicate detection in future sprints. Currently, duplicates
    are solely based on `video_id` and `package_folder`. If the same video is 
    copied to a new folder without metadata, it will currently be treated as a 
    new upload.

This module is stateless — read-only DB queries only.
No writes. No engine state mutations.
"""

import logging
from dataclasses import dataclass

from sqlalchemy.orm import Session
from models import UploadTask

logger = logging.getLogger("watch_folder.duplicate_checker")

# Statuses that indicate the video is actively in the review or upload queue
ACTIVE_QUEUE_STATUSES = {"WATCHED", "REVIEW", "QUEUED", "UPLOADING", "SCHEDULED"}
# Status indicating the video has already been published to YouTube
COMPLETED_STATUSES = {"COMPLETED"}


@dataclass
class DuplicateCheckResult:
    is_duplicate: bool
    reason: str
    existing_task_id: str | None = None


def check(video_id: str, package_folder: str, db: Session, channel_id: str = None) -> DuplicateCheckResult:
    """
    Run the multi-stage duplicate check.

    Rules:
    1. If the video was already uploaded to YouTube (status=COMPLETED, has youtube_video_id, or CampaignAsset CONSUMED),
       it is PERMANENTLY BLOCKED from being imported or uploaded again.
    2. If the video is currently in the active review/upload queue (WATCHED, REVIEW, QUEUED, SCHEDULED, UPLOADING),
       it is SKIPPED to avoid duplicate entries in the active queue.
    3. If the video was never uploaded to YouTube (e.g. was deleted while still in review),
       it is ALLOWED to be re-scanned and imported into review again.
    """
    import os
    if package_folder:
        package_folder = os.path.normpath(package_folder)

    # -----------------------------------------------------------------------
    # Step 1 — Check if video was already uploaded to YouTube (COMPLETED)
    # -----------------------------------------------------------------------
    # Check UploadTask COMPLETED records
    query_completed = db.query(UploadTask).filter(
        (UploadTask.video_id == video_id) | (UploadTask.package_folder == package_folder) | (UploadTask.video_path == package_folder),
        UploadTask.status == "COMPLETED"
    )
    if channel_id:
        query_completed = query_completed.filter(UploadTask.channel_id == channel_id)
    
    completed_task = query_completed.first()
    if completed_task:
        logger.info(
            f"[DUPLICATE] Video already uploaded to YouTube (COMPLETED) | "
            f"video_id={video_id!r} | folder={package_folder!r} | task={completed_task.id} | yt_id={completed_task.youtube_video_id}"
        )
        return DuplicateCheckResult(
            is_duplicate=True,
            reason=f"Video already uploaded to YouTube (Task: {completed_task.id})",
            existing_task_id=completed_task.id,
        )

    # Check CampaignAsset CONSUMED records
    try:
        from models import CampaignAsset, CampaignAssetState
        query_asset = db.query(CampaignAsset).filter(
            (CampaignAsset.filepath == package_folder) | (CampaignAsset.filename == os.path.basename(package_folder)),
            CampaignAsset.status == CampaignAssetState.CONSUMED
        )
        if channel_id:
            query_asset = query_asset.filter(CampaignAsset.channel_id == channel_id)
        consumed_asset = query_asset.first()
        if consumed_asset:
            logger.info(f"[DUPLICATE] CampaignAsset already CONSUMED | folder={package_folder!r}")
            return DuplicateCheckResult(
                is_duplicate=True,
                reason="Video already uploaded via Campaign Engine (CONSUMED)",
                existing_task_id=consumed_asset.id
            )
    except Exception:
        pass

    # -----------------------------------------------------------------------
    # Step 2 — Check if video is currently in the active review/upload queue
    # -----------------------------------------------------------------------
    query_active = db.query(UploadTask).filter(
        (UploadTask.video_id == video_id) | (UploadTask.package_folder == package_folder) | (UploadTask.video_path == package_folder),
        UploadTask.status.in_(ACTIVE_QUEUE_STATUSES)
    )
    if channel_id:
        query_active = query_active.filter(UploadTask.channel_id == channel_id)

    active_task = query_active.first()
    if active_task:
        logger.debug(
            f"[DUPLICATE] Video already in active queue | "
            f"video_id={video_id!r} | folder={package_folder!r} | task={active_task.id} | status={active_task.status}"
        )
        return DuplicateCheckResult(
            is_duplicate=True,
            reason=f"Video already in active queue (status={active_task.status})",
            existing_task_id=active_task.id,
        )

    # -----------------------------------------------------------------------
    # Step 3 — Clear: Video has NOT been uploaded yet and is NOT in active queue
    # -----------------------------------------------------------------------
    return DuplicateCheckResult(is_duplicate=False, reason="CLEAR")
