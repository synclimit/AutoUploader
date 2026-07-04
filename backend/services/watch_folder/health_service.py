"""
health_service.py — WatchFolderHealthService

Tracks per-account health state for the Watch Folder Engine.

Design (Stage 3.5.2-R1):
  Hybrid persistence model:
    - imported_count  → derived from DB (survives restart)
    - last_import     → derived from DB (survives restart)
    - status          → in-memory (ephemeral, reflects current run)
    - last_scan       → in-memory (ephemeral)
    - error_count     → in-memory (ephemeral, since last restart)
    - last_error      → in-memory (ephemeral, since last restart)

All error_count / last_error values are documented in the UI as
"since last restart" to set correct expectations.

Error codes tracked:
    MISSING_METADATA, MISSING_VIDEO, MISSING_VIDEO_ID,
    MALFORMED_METADATA, MISSING_TITLE_FINAL, EMPTY_VIDEO,
    DUPLICATE_SKIPPED, PATH_UNAVAILABLE, IMPORT_FAILED
"""

import logging
from datetime import datetime
from dataclasses import dataclass, field
from typing import Optional

from sqlalchemy.orm import Session
from models import UploadTask

logger = logging.getLogger("watch_folder.health_service")


# ---------------------------------------------------------------------------
# In-memory health snapshot per pipeline
# ---------------------------------------------------------------------------

@dataclass
class PipelineHealth:
    pipeline_type: str
    status: str = "IDLE"                    # IDLE | SCANNING | ERROR | PAUSED
    last_scan: Optional[datetime] = None    # Ephemeral — last time scanner ran
    error_count: int = 0                    # Ephemeral — since last restart
    last_error: Optional[str] = None        # Ephemeral — last error code seen
    last_scan_status: str = "IDLE"          # Ephemeral — last scan cycle outcome
    last_scan_count: int = 0                # Ephemeral — number of packages related to last scan status
    watch_folder_path: Optional[str] = None
    execution_log: list[dict] = field(default_factory=list)


@dataclass
class AccountHealth:
    account_id: str
    pipelines: dict[str, PipelineHealth] = field(default_factory=dict)


# Module-level store: account_id → AccountHealth
_health_store: dict[str, AccountHealth] = {}


# ---------------------------------------------------------------------------
# State mutations — called by engine
# ---------------------------------------------------------------------------

def _get_or_create_pipeline(account_id: str, pipeline_type: str) -> PipelineHealth:
    if account_id not in _health_store:
        _health_store[account_id] = AccountHealth(account_id=account_id)
    account_health = _health_store[account_id]
    if pipeline_type not in account_health.pipelines:
        account_health.pipelines[pipeline_type] = PipelineHealth(pipeline_type=pipeline_type)
    return account_health.pipelines[pipeline_type]


def update_status(account_id: str, pipeline_type: str, status: str) -> None:
    """Update engine state for a pipeline (IDLE / SCANNING / ERROR / PAUSED)."""
    _get_or_create_pipeline(account_id, pipeline_type).status = status


def record_scan(account_id: str, pipeline_type: str) -> None:
    """Mark a scan cycle as completed for this pipeline."""
    health = _get_or_create_pipeline(account_id, pipeline_type)
    health.last_scan = datetime.utcnow()


def record_error(account_id: str, pipeline_type: str, error_code: str) -> None:
    """Log a validation or path error for this pipeline."""
    health = _get_or_create_pipeline(account_id, pipeline_type)
    health.error_count += 1
    health.last_error = error_code
    logger.debug(f"[HEALTH] Error recorded | account={account_id!r} | pipeline={pipeline_type} | code={error_code!r} | total={health.error_count}")


def record_path_unavailable(account_id: str, pipeline_type: str) -> None:
    """Shorthand: record PATH_UNAVAILABLE error and set ERROR status."""
    record_error(account_id, pipeline_type, "PATH_UNAVAILABLE")
    update_status(account_id, pipeline_type, "ERROR")


def record_scan_result(account_id: str, pipeline_type: str, status: str, count: int = 0) -> None:
    """Record the final outcome of the scan cycle for this pipeline."""
    health = _get_or_create_pipeline(account_id, pipeline_type)
    health.last_scan_status = status
    health.last_scan_count = count


def set_watch_folder_path(account_id: str, pipeline_type: str, path: str) -> None:
    health = _get_or_create_pipeline(account_id, pipeline_type)
    health.watch_folder_path = path


def record_log(account_id: str, pipeline_type: str, status: str, message: str) -> None:
    """Record a live runtime log event for the UI."""
    health = _get_or_create_pipeline(account_id, pipeline_type)
    health.execution_log.append({
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "status": status,
        "message": message
    })
    # Keep only the last 20 logs to avoid unbounded growth
    if len(health.execution_log) > 20:
        health.execution_log = health.execution_log[-20:]


# ---------------------------------------------------------------------------
# Query — called by API
# ---------------------------------------------------------------------------

def get_health(account_id: str, db: Session) -> dict:
    """
    Build the full health snapshot for one account, broken down by pipeline.

    Merges in-memory ephemeral fields with DB-derived persistent fields.
    """
    db_stats = _derive_from_db(account_id, db)
    
    if account_id not in _health_store:
        _health_store[account_id] = AccountHealth(account_id=account_id)
    account_health = _health_store[account_id]

    # Ensure all pipelines that exist in DB are present in memory store
    for p_type in db_stats.keys():
        if p_type not in account_health.pipelines:
            account_health.pipelines[p_type] = PipelineHealth(pipeline_type=p_type)

    result = {}
    for p_type, p_health in account_health.pipelines.items():
        stats = db_stats.get(p_type, {"imported_count": 0, "last_import": None})
        
        result[p_type] = {
            "status": p_health.status,
            "last_scan": p_health.last_scan.isoformat() + "Z" if p_health.last_scan else None,
            "last_import": stats["last_import"].isoformat() + "Z" if stats["last_import"] else None,
            "imported_count": stats["imported_count"],
            "error_count": p_health.error_count,
            "last_error": p_health.last_error,
            "last_scan_status": p_health.last_scan_status,
            "last_scan_count": p_health.last_scan_count,
            "watch_folder_path": p_health.watch_folder_path,
            "execution_log": p_health.execution_log
        }

    return {
        "account_id": account_id,
        "pipelines": result
    }


def get_all_health(account_ids: list[str], db: Session) -> list[dict]:
    """
    Build health snapshots for all provided account IDs.
    Used by GET /api/watch-folder/health to return all accounts.
    """
    return [get_health(account_id, db) for account_id in account_ids]


def get_all_tracked_ids() -> list[str]:
    """Return all account IDs currently tracked in the health store."""
    return list(_health_store.keys())


# ---------------------------------------------------------------------------
# DB-derived field helpers
# ---------------------------------------------------------------------------

def _derive_from_db(account_id: str, db: Session) -> dict:
    """
    Query the upload_tasks table to derive persistent health fields per pipeline:
      - imported_count: COUNT(*) of tasks created by Watch Folder for this account
      - last_import:    MAX(created_at) of those tasks

    These values survive backend restarts because they come from the DB.
    """
    try:
        tasks = (
            db.query(UploadTask)
            .filter(
                UploadTask.account_id == account_id,
                UploadTask.metadata_source == "RENDERER",
            )
            .all()
        )
        
        pipeline_stats = {}
        for t in tasks:
            # Fallback legacy to 'long' if missing
            p_type = t.pipeline_type if getattr(t, "pipeline_type", None) else "long"
            if p_type not in pipeline_stats:
                pipeline_stats[p_type] = {"imported_count": 0, "last_import": None}
                
            pipeline_stats[p_type]["imported_count"] += 1
            if not pipeline_stats[p_type]["last_import"] or (t.created_at and t.created_at > pipeline_stats[p_type]["last_import"]):
                pipeline_stats[p_type]["last_import"] = t.created_at
                
        return pipeline_stats
    except Exception as e:
        logger.error(f"[HEALTH] DB query failed for account {account_id!r}: {e}")
        return {}
