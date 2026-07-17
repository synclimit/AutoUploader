import time
import logging
import threading
from datetime import datetime

from database.db import SessionLocal
from models import UploadTask, UploadLog, Channel
from schemas import QueueStatusEnum
from sqlalchemy import or_, and_

from core.engine_base import EngineBase

logger = logging.getLogger("upload_scheduler")

POLL_INTERVAL_SECONDS = 60

class SchedulerEngine(EngineBase):
    def __init__(self):
        self._thread = None
        self._running = False
        logger.info("[SCHEDULER_ENGINE] Initialized")

    def start(self):
        if self._thread and self._thread.is_alive():
            logger.warning("[SCHEDULER_ENGINE] Already running")
            return

        self._running = True
        self._thread = threading.Thread(
            target=self._run_loop,
            name="SchedulerEngine",
            daemon=True,
        )
        self._thread.start()
        logger.info(f"[SCHEDULER_ENGINE] Started — polling interval: {POLL_INTERVAL_SECONDS}s")

    def stop(self):
        logger.info("[SCHEDULER_ENGINE] Stop signal received")
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=10)

    def restart(self):
        self.stop()
        self.start()

    def status(self) -> dict:
        return {"status": "running" if self._running else "stopped"}

    def health(self) -> dict:
        return {
            "status": "running" if self._running else "stopped",
            "polling_interval_seconds": POLL_INTERVAL_SECONDS
        }

    def _run_loop(self):
        logger.info("[SCHEDULER_ENGINE] Background thread started")
        while self._running:
            self._assign_scheduled_times()
            self._process_scheduled_tasks()
            
            # Sleep in increments to allow quick shutdown
            for _ in range(POLL_INTERVAL_SECONDS * 2):
                if not self._running:
                    break
                time.sleep(0.5)
        logger.info("[SCHEDULER_ENGINE] Background thread stopped")

    def _assign_scheduled_times(self):
        import ast
        import random
        from datetime import timedelta
        db = SessionLocal()
        try:
            tasks = (
                db.query(UploadTask)
                .filter(UploadTask.scheduled_at == None)
                .filter(
                    or_(
                        and_(UploadTask.status == QueueStatusEnum.watched, UploadTask.ai_metadata_generated == True),
                        and_(UploadTask.status == QueueStatusEnum.scheduled)
                    )
                )
                .order_by(UploadTask.created_at.asc())
                .all()
            )
            
            # Load existing future tasks to prevent overlap
            future_tasks = (
                db.query(UploadTask)
                .filter(UploadTask.scheduled_at != None)
                .filter(UploadTask.status.in_([QueueStatusEnum.scheduled, QueueStatusEnum.queued]))
                .all()
            )
            
            assigned_times = {}
            for ft in future_tasks:
                if ft.channel_id not in assigned_times:
                    assigned_times[ft.channel_id] = set()
                # Store the base time (without seconds/microseconds or humanize delay) to prevent collisions
                assigned_times[ft.channel_id].add(ft.scheduled_at.replace(second=0, microsecond=0))
            
            now_local = datetime.now()
            from datetime import timezone
            
            for task in tasks:
                # Phase 6: Legacy fallback
                if not getattr(task, "pipeline_type", None):
                    task.pipeline_type = "long"
                    
                try:
                    import json
                    channel = db.query(Channel).filter(Channel.id == task.channel_id).first()
                    account_pipelines = json.loads(channel.pipelines) if channel and channel.pipelines else {}
                    p_key = task.pipeline_type
                    p_config = account_pipelines.get(p_key, {})
                    schedule_list = p_config.get("schedule")
                    
                    if schedule_list and isinstance(schedule_list, list) and len(schedule_list) > 0:
                        schedule_times = schedule_list
                    else:
                        # Fallback to snapshotted schedule_time if pipeline config is empty
                        s_time = getattr(task, "schedule_time", None)
                        if s_time:
                            if s_time.startswith("["):
                                schedule_times = ast.literal_eval(s_time)
                            else:
                                schedule_times = [s_time]
                        else:
                            schedule_times = ["12:00"]
                except Exception as e:
                    schedule_times = ["12:00"]
                    
                schedule_times.sort()
                
                chosen_dt = None
                day_offset = 0
                
                # Look ahead up to 365 days to find the next available slot
                while not chosen_dt and day_offset < 365:
                    target_date = now_local + timedelta(days=day_offset)
                    target_date_str = target_date.strftime("%Y-%m-%d")
                    
                    for t in schedule_times:
                        try:
                            if "-" in str(t):
                                t_clean = str(t).replace("T", " ")
                                try:
                                    t_dt_local = datetime.strptime(t_clean[:16], "%Y-%m-%d %H:%M")
                                except ValueError:
                                    t_dt_local = datetime.strptime(t_clean, "%Y-%m-%d %H:%M:%S")
                                if t_dt_local.strftime("%Y-%m-%d") != target_date_str:
                                    continue
                            else:
                                t_dt_local = datetime.strptime(f"{target_date_str} {t}", "%Y-%m-%d %H:%M")
                        except Exception as parse_err:
                            logger.warning(f"[SCHEDULER_ENGINE] Could not parse schedule time '{t}': {parse_err}")
                            continue
                        
                        # Allow 30 minutes grace period if the schedule was missed while AI or video processing was running
                        if t_dt_local > now_local - timedelta(minutes=30):
                            # Convert to UTC for DB storage
                            t_dt_utc = t_dt_local.astimezone().astimezone(timezone.utc).replace(tzinfo=None)
                            
                            # Check if this exact slot is already taken for this channel
                            if task.channel_id in assigned_times and t_dt_utc in assigned_times[task.channel_id]:
                                continue # Slot taken, try next
                                
                            chosen_dt = t_dt_utc
                            if task.channel_id not in assigned_times:
                                assigned_times[task.channel_id] = set()
                            assigned_times[task.channel_id].add(chosen_dt)
                            break
                            
                    day_offset += 1
                    
                if not chosen_dt:
                    # Fallback if somehow 365 days were taken or no time was found
                    chosen_dt = datetime.utcnow() + timedelta(days=1)
                    
                # Apply humanize delay
                if getattr(task, "humanize_enabled", False):
                    min_m = getattr(task, "humanize_min", 0)
                    max_m = getattr(task, "humanize_max", 0)
                    if max_m > min_m:
                        from datetime import timedelta
                        delay = random.randint(min_m, max_m)
                        chosen_dt += timedelta(minutes=delay)
                        
                task.scheduled_at = chosen_dt
                
                if task.status == QueueStatusEnum.watched and getattr(task, "upload_mode", "") != "Auto Upload":
                    msg = f"Assigned draft publish time {chosen_dt} for Review."
                    db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.watched.value, message=msg))
                elif getattr(task, "schedule_mode", "application") == "youtube":
                    task.status = QueueStatusEnum.queued
                    if getattr(task, "privacy_status", "private") != "private":
                        task.privacy_status = "private"
                    msg = f"Schedule Mode is YouTube. Assigned publish time {chosen_dt}. Dispatching to Upload Engine immediately."
                    db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.queued.value, message=msg))
                else:
                    task.status = QueueStatusEnum.scheduled
                    msg = f"Assigned scheduled time {chosen_dt}. Waiting in Scheduler."
                    db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.scheduled.value, message=msg))
                
                db.commit()
                logger.info(f"[SCHEDULER_ENGINE] Task {task.id} assigned scheduled_at={chosen_dt}, status={task.status}")
                
        except Exception as e:
            logger.error(f"[SCHEDULER_ENGINE] Error assigning scheduled times: {e}")
            db.rollback()
        finally:
            db.close()

    def _process_scheduled_tasks(self):
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            
            # Find all SCHEDULED tasks whose scheduled_at time is in the past or now
            tasks = (
                db.query(UploadTask)
                .filter(UploadTask.status == QueueStatusEnum.scheduled)
                .filter(UploadTask.scheduled_at != None)
                .filter(UploadTask.scheduled_at <= now)
                .all()
            )

            for task in tasks:
                logger.info(f"[SCHEDULER_ENGINE] Task {task.id} scheduled time reached. Transitioning to QUEUED.")
                
                # Transition SCHEDULED -> QUEUED
                task.status = QueueStatusEnum.queued
                
                if getattr(task, "schedule_mode", "application") == "application":
                    task.scheduled_at = None
                    if getattr(task, "privacy_status", "") != "public":
                        task.privacy_status = "public"
                    db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.queued.value, message="Scheduled time reached. Privacy set to PUBLIC and scheduled_at cleared. Task is now QUEUED."))
                else:
                    db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.queued.value, message="Scheduled time reached. Task is now QUEUED."))
                db.commit()

        except Exception as e:
            logger.error(f"[SCHEDULER_ENGINE] Error processing scheduled tasks: {e}")
            db.rollback()
        finally:
            db.close()

_scheduler_instance = None

def get_scheduler_engine() -> SchedulerEngine:
    global _scheduler_instance
    if _scheduler_instance is None:
        _scheduler_instance = SchedulerEngine()
    return _scheduler_instance