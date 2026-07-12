"""
engine.py — WatchFolderEngine

Background watch folder scanning engine.

Architecture (Stage 3.5.2-R1 locked):
  - threading.Thread with daemon=True
  - Per-channel scan loop (queries DB for enabled channels each cycle)
  - Scan interval: 15 seconds
  - Pipeline per folder: Scanner → Validator → DuplicateChecker → Importer
  - ERROR state: path inaccessible — retries on next interval, auto-recovers
  - PAUSED state: can be set programmatically (future Settings integration)
  - No asyncio. No Gemini. No YouTube. No filesystem writes.

State machine per pipeline:
  IDLE → SCANNING → (per folder: VALIDATING → IMPORTING) → IDLE
  Any scan: path error → ERROR (retries on next cycle)
"""
import time
import logging
import threading
import json
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy import or_

from database.db import SessionLocal
from models import Channel, UploadTask
from services.watch_folder import scanner, validator, duplicate_checker, importer
from services.watch_folder import health_service
from core.engine_base import EngineBase

logger = logging.getLogger("watch_folder.engine")

SCAN_INTERVAL_SECONDS = 15

@dataclass
class ScanSummary:
    success: bool = True
    accounts_scanned: int = 0
    packages_found: int = 0
    tasks_created: int = 0
    duplicates_skipped: int = 0
    validation_errors: int = 0


class WatchFolderEngine(EngineBase):
    def __init__(self):
        self._thread: threading.Thread | None = None
        self._running: bool = False
        self._paused: bool = False
        logger.info("[ENGINE] WatchFolderEngine initialized")

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, name="WatchFolderEngine", daemon=True)
        self._thread.start()
        logger.info(f"[ENGINE] Started — scan interval: {SCAN_INTERVAL_SECONDS}s")

    def stop(self):
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=10)

    def pause(self):
        self._paused = True

    def resume(self):
        self._paused = False

    def restart(self):
        self.stop()
        self.start()

    def status(self) -> dict:
        return {"status": "running" if self._running else "stopped", "paused": self._paused}

    def health(self) -> dict:
        return {"status": "running" if self._running else "stopped", "paused": self._paused, "polling_interval_seconds": SCAN_INTERVAL_SECONDS}

    def scan_now(self, channel_id: str = None, pipeline_type: str = None) -> ScanSummary:
        logger.info(f"[ENGINE] scan_now() triggered manually | channel_id={channel_id} | pipeline_type={pipeline_type}")
        summary = ScanSummary()
        db = SessionLocal()
        try:
            query = db.query(Channel)
            if channel_id:
                query = query.filter(Channel.id == channel_id)
            enabled_accounts = query.all()
            print('enabled_accounts:', enabled_accounts)
        except Exception as e:
            logger.error(f"[ENGINE] scan_now: DB error: {e}")
            db.close()
            summary.success = False
            return summary

        summary.accounts_scanned = len(enabled_accounts)

        for channel in enabled_accounts:
            acc_summary = self._scan_account(channel, db, target_pipeline=pipeline_type)
            summary.packages_found += acc_summary.packages_found
            summary.tasks_created += acc_summary.tasks_created
            summary.duplicates_skipped += acc_summary.duplicates_skipped
            summary.validation_errors += acc_summary.validation_errors

        db.close()
        return summary

    def _run_loop(self):
        logger.info("[ENGINE] Background thread started")
        while self._running:
            if not self._paused:
                self._run_cycle()
            for _ in range(SCAN_INTERVAL_SECONDS * 2):
                if not self._running:
                    break
                time.sleep(0.5)

    def _run_cycle(self):
        db = SessionLocal()
        try:
            enabled_accounts = db.query(Channel).all()
        except Exception as e:
            db.close()
            return
        db.close()

        if not enabled_accounts:
            return

        for channel in enabled_accounts:
            if not self._running:
                break
            db = SessionLocal()
            try:
                self._scan_account(channel, db)
            finally:
                db.close()

    def _scan_account(self, channel: Channel, db: Session, target_pipeline: str = None) -> ScanSummary:
        summary = ScanSummary()
        channel_id = channel.id

        try:
            pipelines = json.loads(channel.pipelines) if channel.pipelines else {}
        except:
            pipelines = {}

        try:
            pipeline_states = json.loads(channel.pipeline_states) if channel.pipeline_states else {}
        except:
            pipeline_states = {}

        # Legacy fallback
        if not pipelines and channel.watch_folder_enabled and channel.watch_folder:
            pipelines = {
                "long": {
                    "enabled": True,
                    "watch_folder": channel.watch_folder,
                    "daily_limit": 2,
                    "processing_order": "oldest_first",
                    "schedule_mode": "application",
                    "schedule": ["09:00", "18:00"],
                    "publish_mode": channel.publish_visibility or "private",
                    "retry_failed": True,
                    "duplicate_policy": "skip"
                }
            }
            channel.pipelines = json.dumps(pipelines)
            db.commit()

        if not pipelines:
                return summary

        state_modified = False
        today_str = datetime.utcnow().strftime("%Y-%m-%d")

        for p_key, p_config in pipelines.items():
            if not self._running:
                break

            if target_pipeline and p_key != target_pipeline:
                continue

            if p_config.get("enabled") is False:
                continue

            watch_path = p_config.get("watch_folder")
            if not watch_path:
                continue

            health_service.update_status(channel_id, p_key, "SCANNING")
            health_service.set_watch_folder_path(channel_id, p_key, watch_path)
            health_service.record_log(channel_id, p_key, "PASS", "Pipeline Configured")
            health_service.record_scan(channel_id, p_key)

            daily_limit = int(p_config.get("daily_limit", 2))
            
            # Ground truth: Calculate today_intake directly from DB
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            today_intake = db.query(UploadTask).filter(
                UploadTask.channel_id == channel_id,
                UploadTask.created_at >= today_start,
                or_(UploadTask.pipeline_type == p_key, UploadTask.pipeline_type == None)
            ).count()

            state = pipeline_states.get(p_key, {"today_intake": 0, "last_reset": today_str})

            if state.get("last_reset") != today_str:
                state["last_reset"] = today_str
                state_modified = True
                
            state["today_intake"] = today_intake

            if daily_limit > 0 and state.get("today_intake", 0) >= daily_limit:
                health_service.record_log(channel_id, p_key, "FAIL", "Daily Limit Reached")
                health_service.update_status(channel_id, p_key, "IDLE")
                continue

            candidates, path_ok = scanner.scan(watch_path)
            if not path_ok:
                health_service.record_path_unavailable(channel_id, p_key)
                health_service.record_scan_result(channel_id, p_key, "PATH_UNAVAILABLE", 0)
                health_service.record_log(channel_id, p_key, "FAIL", "Folder Not Found")
                continue

            health_service.record_log(channel_id, p_key, "PASS", "Folder Exists")

            if not candidates:
                health_service.record_scan_result(channel_id, p_key, "NO_PACKAGES", 0)
                health_service.update_status(channel_id, p_key, "IDLE")
                continue
                
            summary.packages_found += len(candidates)
            health_service.record_log(channel_id, p_key, "PASS", f"Packages Found ({len(candidates)})")

            # Known tasks
            from schemas import QueueStatusEnum
            known_tasks = db.query(UploadTask).filter(UploadTask.channel_id == channel_id).all()
            locked_paths = set()
            for t in known_tasks:
                if t.status in [QueueStatusEnum.watched, QueueStatusEnum.review, QueueStatusEnum.scheduled, QueueStatusEnum.queued, QueueStatusEnum.uploading, QueueStatusEnum.completed, QueueStatusEnum.cancelled]:
                    locked_paths.add(t.package_folder)
            
            if not p_config.get("retry_failed", True):
                for t in known_tasks:
                    if t.status == QueueStatusEnum.failed:
                        locked_paths.add(t.package_folder)

            valid_candidates = []
            for c in candidates:
                c_path = c if isinstance(c, str) else c.get("path")
                if c_path not in locked_paths:
                    valid_candidates.append(c)

            order = p_config.get("processing_order", "oldest_first")
            if order == "oldest_first":
                valid_candidates.sort(key=lambda x: x.get("mtime", 0) if isinstance(x, dict) else 0)
            elif order == "newest_first":
                valid_candidates.sort(key=lambda x: x.get("mtime", 0) if isinstance(x, dict) else 0, reverse=True)

            p_imported = 0
            p_dupes = 0
            p_errors = 0

            for folder_entry in valid_candidates:
                if not self._running:
                    break
                if daily_limit > 0 and state.get("today_intake", 0) >= daily_limit:
                    health_service.record_log(channel_id, p_key, "FAIL", "Daily Limit Reached")
                    break

                folder_path = folder_entry if isinstance(folder_entry, str) else folder_entry.get("path")
                
                result = validator.validate(folder_path)
                if not result.success:
                    health_service.record_error(channel_id, p_key, result.error_code)
                    health_service.record_log(channel_id, p_key, "FAIL", f"Validation Failed: {result.error_code}")
                    p_errors += 1
                    locked_paths.add(folder_path)
                    summary.validation_errors += 1
                    continue

                health_service.record_log(channel_id, p_key, "PASS", "Package Validated")

                dup_result = duplicate_checker.check(
                    video_id=result.video_id,
                    package_folder=folder_path,
                    db=db,
                )

                if dup_result.is_duplicate:
                    health_service.record_error(channel_id, p_key, "DUPLICATE_SKIPPED")
                    health_service.record_log(channel_id, p_key, "FAIL", "Duplicate Package")
                    p_dupes += 1
                    locked_paths.add(folder_path)
                    summary.duplicates_skipped += 1
                    continue

                health_service.record_log(channel_id, p_key, "PASS", "Duplicate Check")

                try:
                    task = importer.create_task(result, channel, db, p_key, p_config, today_intake=state.get("today_intake", 0))
                    p_imported += 1
                    summary.tasks_created += 1
                    state["today_intake"] = state.get("today_intake", 0) + 1
                    state_modified = True
                    health_service.record_log(channel_id, p_key, "PASS", "UploadTask Created")
                    health_service.record_log(channel_id, p_key, "PASS", "Database Commit")
                    
                    pipeline_states[p_key] = state
                    channel.pipeline_states = json.dumps(pipeline_states)
                    db.commit()
                except Exception as e:
                    logger.error(f"[ENGINE] Import failed | folder={folder_path!r} | error={e}")
                    health_service.record_error(channel_id, p_key, "IMPORT_FAILED")
                    health_service.record_log(channel_id, p_key, "FAIL", "Import Failed")
                    p_errors += 1
                    summary.validation_errors += 1

            pipeline_states[p_key] = state

            if p_imported > 0:
                health_service.record_scan_result(channel_id, p_key, "IMPORTED", p_imported)
            elif p_dupes > 0:
                health_service.record_scan_result(channel_id, p_key, "DUPLICATE", p_dupes)
            elif p_errors > 0:
                health_service.record_scan_result(channel_id, p_key, "VALIDATION_FAILED", p_errors)
            else:
                health_service.record_scan_result(channel_id, p_key, "NO_PACKAGES", 0)

            health_service.update_status(channel_id, p_key, "IDLE")

        if state_modified:
            channel.pipeline_states = json.dumps(pipeline_states)
            db.commit()

        return summary

_engine_instance: WatchFolderEngine | None = None
def get_engine() -> WatchFolderEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = WatchFolderEngine()
    return _engine_instance
