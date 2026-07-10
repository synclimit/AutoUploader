import time
import logging
import threading
import uuid
import json
from datetime import datetime

from sqlalchemy.orm import Session
from database.db import SessionLocal

from models import (
    CampaignUploadPlan, 
    CampaignExecutionState, 
    CampaignUploadJournal, 
    UploadTask, 
    CampaignAsset,
    CampaignReviewSession,
    FailureCategory
)
from schemas import UploadTaskCreate, QueueStatusEnum
from services.execution_dispatcher import ExecutionDispatcher
from services.events import get_event_bus

logger = logging.getLogger("campaign_execution")

POLL_INTERVAL_SECONDS = 15

class CampaignExecutionEngine:
    def __init__(self):
        self._thread = None
        self._running = False
        logger.info("[CAMPAIGN_EXECUTION] Initialized Orchestrator")

    def start(self):
        if self._thread and self._thread.is_alive():
            logger.warning("[CAMPAIGN_EXECUTION] Already running")
            return

        self._running = True
        self._thread = threading.Thread(
            target=self._run_loop,
            name="CampaignExecutionEngine",
            daemon=True,
        )
        self._thread.start()
        logger.info(f"[CAMPAIGN_EXECUTION] Started — polling interval: {POLL_INTERVAL_SECONDS}s")

    def stop(self):
        logger.info("[CAMPAIGN_EXECUTION] Stop signal received")
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=10)

    def _run_loop(self):
        logger.info("[CAMPAIGN_EXECUTION] Background orchestrator started")
        while self._running:
            self._process_ready_plans()
            self._monitor_uploading_plans()
            
            for _ in range(POLL_INTERVAL_SECONDS * 2):
                if not self._running:
                    break
                time.sleep(0.5)
        logger.info("[CAMPAIGN_EXECUTION] Background orchestrator stopped")

    def _process_ready_plans(self):
        db = SessionLocal()
        try:
            now_utc = datetime.utcnow()
            
            # Find READY plans whose time has come
            ready_plans = db.query(CampaignUploadPlan).filter(
                CampaignUploadPlan.execution_status == CampaignExecutionState.READY,
                CampaignUploadPlan.humanized_datetime <= now_utc
            ).all()

            for plan in ready_plans:
                asset = db.query(CampaignAsset).filter(CampaignAsset.id == plan.campaign_asset_id).first()
                if not asset:
                    self.handle_task_failed(db, plan, None, "Physical CampaignAsset not found.", FailureCategory.VALIDATION)
                    continue

                import os
                package_folder = os.path.dirname(asset.filename) if "/" in asset.filename or "\\" in asset.filename else ""
                
                task_data = UploadTaskCreate(
                    account_id=plan.channel_id,
                    metadata_source="CAMPAIGN",
                    source_type="CAMPAIGN_EXECUTION",
                    source_id=plan.id,
                    execution_source="CAMPAIGN",
                    correlation_id=plan.correlation_id,
                    execution_no=plan.execution_no,
                    package_folder=package_folder,
                    video_path=asset.filename,
                    title=plan.title,
                    description=plan.description,
                    tags=plan.tags,
                    privacy_status=plan.visibility or "private",
                    made_for_kids=False,
                    video_id=asset.fingerprint, # duplicate detection key
                    playlist_id=plan.playlist,
                    category_id=int(plan.category) if plan.category and plan.category.isdigit() else None,
                    default_language=plan.language,
                    audience=plan.audience,
                    pipeline_type=plan.pipeline_type,
                    status=QueueStatusEnum.queued # Dispatched immediately to UploadEngine
                )
                
                if plan.thumbnail:
                    task_data.thumbnail_path = plan.thumbnail
                    
                # Create Task using Dispatcher abstraction
                new_task = ExecutionDispatcher.dispatch(db, task_data)
                
                self.handle_task_created(db, plan, new_task)
                
        except Exception as e:
            logger.error(f"[CAMPAIGN_EXECUTION] Error processing READY plans: {e}")
        finally:
            db.close()

    def _monitor_uploading_plans(self):
        db = SessionLocal()
        try:
            uploading_plans = db.query(CampaignUploadPlan).filter(
                CampaignUploadPlan.execution_status == CampaignExecutionState.UPLOADING
            ).all()

            for plan in uploading_plans:
                if not plan.upload_task_id:
                    self.handle_task_failed(db, plan, None, "Lost reference to UploadTask.", FailureCategory.UNKNOWN)
                    continue

                task = db.query(UploadTask).filter(UploadTask.id == plan.upload_task_id).first()
                if not task:
                    self.handle_task_failed(db, plan, None, "UploadTask deleted externally.", FailureCategory.UNKNOWN)
                    continue

                if task.status == QueueStatusEnum.processing.value and not plan.execution_started_at:
                    self.handle_task_started(db, plan, task)
                    
                elif task.status == QueueStatusEnum.completed.value:
                    self.handle_task_completed(db, plan, task)
                    
                elif task.status == QueueStatusEnum.failed.value:
                    self.handle_task_failed(db, plan, task, task.failure_reason or "Unknown Error", FailureCategory.YOUTUBE)
                    
                elif task.status == QueueStatusEnum.cancelled.value:
                    self.handle_task_cancelled(db, plan, task)
                    
        except Exception as e:
            logger.error(f"[CAMPAIGN_EXECUTION] Error monitoring UPLOADING plans: {e}")
        finally:
            db.close()

    # --- HANDLERS ---
    
    def _log_summary(self, action: str, plan: CampaignUploadPlan, task: UploadTask = None):
        summary = {
            "CorrelationId": plan.correlation_id,
            "ExecutionNo": plan.execution_no,
            "Campaign": plan.review_session_id,
            "Plan": plan.id,
            "Task": task.id if task else None,
            "Attempt": plan.attempt,
            "ExecutionStatus": plan.execution_status.value if plan.execution_status else None,
            "UploadStatus": task.status if task else None,
            "ExecutionSource": "CAMPAIGN",
            "YoutubeVideoId": plan.youtube_video_id,
            "PublishAt": plan.youtube_publish_at.isoformat() if plan.youtube_publish_at else None,
            "StartedAt": plan.execution_started_at.isoformat() if plan.execution_started_at else None,
            "FinishedAt": plan.execution_finished_at.isoformat() if plan.execution_finished_at else None,
            "DurationMs": None,
            "FailureCategory": plan.failure_category.value if plan.failure_category else None,
            "FailureReason": plan.last_error
        }
        if plan.execution_started_at and plan.execution_finished_at:
            summary["DurationMs"] = int((plan.execution_finished_at - plan.execution_started_at).total_seconds() * 1000)
            
        logger.info(f"[EXECUTION_SUMMARY] {action} {json.dumps(summary)}")

    def handle_task_created(self, db: Session, plan: CampaignUploadPlan, task: UploadTask):
        plan.upload_task_id = task.id
        plan.execution_status = CampaignExecutionState.UPLOADING
        db.commit()
        
        self._log_summary("CREATED", plan, task)
        get_event_bus().publish("campaign.task.created", {"plan_id": plan.id, "task_id": task.id})

    def handle_task_started(self, db: Session, plan: CampaignUploadPlan, task: UploadTask):
        plan.execution_started_at = datetime.utcnow()
        db.commit()
        
        self._log_summary("STARTED", plan, task)
        get_event_bus().publish("campaign.task.started", {"plan_id": plan.id, "task_id": task.id})

    def handle_task_completed(self, db: Session, plan: CampaignUploadPlan, task: UploadTask):
        plan.execution_status = CampaignExecutionState.UPLOADED
        plan.youtube_video_id = task.youtube_video_id
        plan.youtube_publish_at = plan.publish_datetime
        plan.execution_finished_at = datetime.utcnow()
        db.commit()
        
        self._record_journal(db, plan, task, "UPLOADED")
        self._log_summary("COMPLETED", plan, task)
        get_event_bus().publish("campaign.task.completed", {"plan_id": plan.id, "task_id": task.id})
        self._evaluate_campaign_lifecycle(db, plan.review_session_id)

    def handle_task_failed(self, db: Session, plan: CampaignUploadPlan, task: UploadTask, error: str, category: FailureCategory):
        plan.execution_status = CampaignExecutionState.FAILED
        plan.last_error = error
        plan.failure_category = category
        plan.execution_finished_at = datetime.utcnow()
        db.commit()
        
        self._record_journal(db, plan, task, "FAILED")
        self._log_summary("FAILED", plan, task)
        get_event_bus().publish("campaign.task.failed", {"plan_id": plan.id, "task_id": task.id if task else None})
        self._evaluate_campaign_lifecycle(db, plan.review_session_id)

    def handle_task_cancelled(self, db: Session, plan: CampaignUploadPlan, task: UploadTask):
        plan.execution_status = CampaignExecutionState.CANCELLED
        plan.last_error = "UploadTask cancelled externally."
        plan.failure_category = FailureCategory.UNKNOWN
        plan.execution_finished_at = datetime.utcnow()
        db.commit()
        
        self._record_journal(db, plan, task, "CANCELLED")
        self._log_summary("CANCELLED", plan, task)
        get_event_bus().publish("campaign.task.cancelled", {"plan_id": plan.id, "task_id": task.id})
        self._evaluate_campaign_lifecycle(db, plan.review_session_id)

    def _record_journal(self, db: Session, plan: CampaignUploadPlan, task: UploadTask, result: str):
        duration_ms = None
        if plan.execution_started_at and plan.execution_finished_at:
            duration_ms = int((plan.execution_finished_at - plan.execution_started_at).total_seconds() * 1000)
            
        journal = CampaignUploadJournal(
            campaign_upload_plan_id=plan.id,
            upload_task_id=plan.upload_task_id,
            source_id=plan.id,
            correlation_id=plan.correlation_id,
            execution_no=plan.execution_no,
            attempt=plan.attempt,
            browser_profile=task.profile_id if task else None,
            result=result,
            status=result, # Keep for compat temporarily
            duration_seconds=duration_ms // 1000 if duration_ms else None,
            duration_ms=duration_ms,
            youtube_video_id=plan.youtube_video_id,
            publish_time=plan.youtube_publish_at,
            failure_category=plan.failure_category.value if plan.failure_category else None,
            error_message=plan.last_error,
            failure_reason=plan.last_error,
            started_at=plan.execution_started_at,
            finished_at=plan.execution_finished_at
        )
        db.add(journal)
        db.commit()

    def _evaluate_campaign_lifecycle(self, db: Session, session_id: str):
        session = db.query(CampaignReviewSession).filter(CampaignReviewSession.id == session_id).first()
        if not session:
            return
            
        if session.status == "FINISHED":
            return
            
        all_plans = db.query(CampaignUploadPlan).filter(CampaignUploadPlan.review_session_id == session_id).all()
        if not all_plans:
            return
            
        terminal_states = [CampaignExecutionState.UPLOADED, CampaignExecutionState.FAILED, CampaignExecutionState.CANCELLED]
        
        all_terminal = all(p.execution_status in terminal_states for p in all_plans)
        if all_terminal:
            session.status = "FINISHED"
            db.commit()
            logger.info(f"[CAMPAIGN_LIFECYCLE] Review Session {session_id} finished automatically.")

_engine_instance = None

def get_campaign_execution_engine() -> CampaignExecutionEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = CampaignExecutionEngine()
    return _engine_instance


class CampaignExecutionService:
    @staticmethod
    def start_campaign(db: Session, session_id: str, channel_id: str, pipeline_type: str) -> int:
        plans = db.query(CampaignUploadPlan).filter(
            CampaignUploadPlan.review_session_id == session_id,
            CampaignUploadPlan.channel_id == channel_id,
            CampaignUploadPlan.pipeline_type == pipeline_type,
            CampaignUploadPlan.execution_status == CampaignExecutionState.PLANNED
        ).all()
        
        execution_no = int(time.time())
        correlation_base = f"CAMPAIGN-{datetime.utcnow().strftime('%Y%m%d')}"

        for plan in plans:
            plan.execution_status = CampaignExecutionState.READY
            plan.correlation_id = f"{correlation_base}-{uuid.uuid4().hex[:8].upper()}"
            plan.execution_no = execution_no
            plan.attempt = 1
            
        db.commit()
        return len(plans)

    @staticmethod
    def retry_plan(db: Session, plan_id: str) -> CampaignUploadPlan:
        plan = db.query(CampaignUploadPlan).filter(CampaignUploadPlan.id == plan_id).first()
        if not plan:
            raise ValueError(f"Upload Plan {plan_id} not found.")

        if plan.execution_status != CampaignExecutionState.FAILED:
            raise ValueError("Only FAILED plans can be retried.")

        plan.retry_count += 1
        plan.attempt += 1 # Attempt increments, correlation_id stays the same
        
        plan.execution_status = CampaignExecutionState.READY
        plan.last_error = None
        plan.failure_category = None
        plan.execution_started_at = None
        plan.execution_finished_at = None
        plan.upload_task_id = None
        
        db.commit()
        db.refresh(plan)
        return plan
