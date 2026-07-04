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

# Statuses that indicate the video has already been actively processed
ACTIVE_STATUSES = {"WATCHED", "REVIEW", "QUEUED", "UPLOADING", "COMPLETED", "SCHEDULED"}
# Statuses where a re-import is considered a safe retry
RETRY_SAFE_STATUSES = {"FAILED", "CANCELLED"}


@dataclass
class DuplicateCheckResult:
    is_duplicate: bool
    reason: str
    existing_task_id: str | None = None


def check(video_id: str, package_folder: str, db: Session) -> DuplicateCheckResult:
    """
    Run the two-stage duplicate check.

    Args:
        video_id:       From validated metadata.json (or auto-generated RAW_id).
        package_folder: Absolute folder path of the candidate package.
        db:             Active SQLAlchemy session (read-only).

    Returns:
        DuplicateCheckResult with is_duplicate=True → caller must skip import.
    """

    # -----------------------------------------------------------------------
    # Step 1 — Primary: video_id lookup
    # -----------------------------------------------------------------------
    existing = (
        db.query(UploadTask)
        .filter(UploadTask.video_id == video_id)
        .first()
    )

    if existing:
        if existing.status in ACTIVE_STATUSES:
            logger.warning(
                f"[DUPLICATE] Duplicate Skipped | "
                f"video_id={video_id!r} | "
                f"folder={package_folder!r} | "
                f"existing_task={existing.id} | "
                f"status={existing.status}"
            )
            return DuplicateCheckResult(
                is_duplicate=True,
                reason=f"video_id already imported (status={existing.status})",
                existing_task_id=existing.id,
            )

        if existing.status in RETRY_SAFE_STATUSES:
            logger.info(
                f"[DUPLICATE] Previous import {existing.status} — re-import allowed | "
                f"video_id={video_id!r} | folder={package_folder!r}"
            )
            # Fall through — safe to re-import

    # -----------------------------------------------------------------------
    # Step 2 — Secondary: package_folder rescan guard
    # -----------------------------------------------------------------------
    existing_by_path = (
        db.query(UploadTask)
        .filter(UploadTask.package_folder == package_folder)
        .first()
    )

    if existing_by_path:
        logger.debug(
            f"[DUPLICATE] Folder already in DB (rescan guard) | "
            f"folder={package_folder!r} | task={existing_by_path.id}"
        )
        return DuplicateCheckResult(
            is_duplicate=True,
            reason="package_folder already imported",
            existing_task_id=existing_by_path.id,
        )

    # -----------------------------------------------------------------------
    # Clear — safe to import
    # -----------------------------------------------------------------------
    return DuplicateCheckResult(is_duplicate=False, reason="CLEAR")
