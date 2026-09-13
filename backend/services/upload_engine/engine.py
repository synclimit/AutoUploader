import time
import logging
import threading
import os
from datetime import datetime
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

from database.db import SessionLocal
from models import UploadTask, UploadLog, Channel
from schemas import QueueStatusEnum

from core.engine_base import EngineBase

from services.system.notification_service import NotificationService
from models import GlobalSettings

from .providers.upload_context import UploadContext
from .providers.provider_registry import ProviderRegistry
from .providers.playwright_provider import PlaywrightUploader
from .providers.api_provider import APIUploader

# Register providers at module level
ProviderRegistry.register("playwright", PlaywrightUploader)
ProviderRegistry.register("api", APIUploader)

logger = logging.getLogger("upload_engine")

POLL_INTERVAL_SECONDS = 15

class UploadEngine(EngineBase):
    def __init__(self):
        self._thread = None
        self._running = False
        self._processed_tasks_count = 0
        logger.info("[UPLOAD_ENGINE] Initialized")

    def start(self):
        if self._thread and self._thread.is_alive():
            logger.warning("[UPLOAD_ENGINE] Already running")
            return

        # Reset any stuck UPLOADING tasks back to QUEUED
        db = SessionLocal()
        try:
            stuck_tasks = db.query(UploadTask).filter(UploadTask.status == QueueStatusEnum.uploading).all()
            for task in stuck_tasks:
                task.status = QueueStatusEnum.queued
                task.upload_progress = 0
            if stuck_tasks:
                db.commit()
                logger.info(f"[UPLOAD_ENGINE] Reset {len(stuck_tasks)} stuck tasks back to QUEUED")
        except Exception as e:
            logger.error(f"[UPLOAD_ENGINE] Failed to reset stuck tasks: {e}")
        finally:
            db.close()

        self._running = True
        self._thread = threading.Thread(
            target=self._run_loop,
            name="UploadEngine",
            daemon=True,
        )
        self._thread.start()
        logger.info(f"[UPLOAD_ENGINE] Started — polling interval: {POLL_INTERVAL_SECONDS}s")

    def stop(self):
        logger.info("[UPLOAD_ENGINE] Stop signal received")
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
            "processed_tasks": self._processed_tasks_count,
            "polling_interval_seconds": POLL_INTERVAL_SECONDS
        }

    def _run_loop(self):
        logger.info("[UPLOAD_ENGINE] Background thread started")
        while self._running:
            self._process_queue()
            
            # Sleep in increments to allow quick shutdown
            for _ in range(POLL_INTERVAL_SECONDS * 2):
                if not self._running:
                    break
                time.sleep(0.5)
        logger.info("[UPLOAD_ENGINE] Background thread stopped")

    def _process_queue(self):
        db = SessionLocal()
        try:
            # Find the next QUEUED task
            task = (
                db.query(UploadTask)
                .filter(UploadTask.status == QueueStatusEnum.queued)
                .order_by(UploadTask.created_at.asc())
                .first()
            )

            if not task:
                return

            channel = db.query(Channel).filter(Channel.id == task.channel_id).first()
            if not channel:
                task.status = QueueStatusEnum.failed
                task.failure_reason = "Channel not found"
                task.completed_at = datetime.utcnow()
                db.commit()
                return

            logger.info(f"[UPLOAD_ENGINE] Picked up task {task.id} for processing")
            db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.queued.value, message="Picked up task for processing"))
            
            # Pre-upload Validation
            if not os.path.exists(task.video_path):
                task.status = QueueStatusEnum.failed
                task.failure_reason = "SOURCE FILE NOT FOUND"
                task.completed_at = datetime.utcnow()
                db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.failed.value, message=task.failure_reason))
                db.commit()
                logger.error(f"[UPLOAD_ENGINE] Task {task.id} failed: SOURCE FILE NOT FOUND ({task.video_path})")
                return

            if not os.access(task.video_path, os.R_OK):
                task.status = QueueStatusEnum.failed
                task.failure_reason = "SOURCE FILE NOT READABLE"
                task.completed_at = datetime.utcnow()
                db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.failed.value, message=task.failure_reason))
                db.commit()
                logger.error(f"[UPLOAD_ENGINE] Task {task.id} failed: SOURCE FILE NOT READABLE ({task.video_path})")
                return

            if task.file_size is not None and task.file_size > 0:
                try:
                    current_size = os.path.getsize(task.video_path)
                    if current_size != task.file_size:
                        task.status = QueueStatusEnum.failed
                        task.failure_reason = "FILE MODIFIED"
                        task.completed_at = datetime.utcnow()
                        db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.failed.value, message=task.failure_reason))
                        db.commit()
                        logger.error(f"[UPLOAD_ENGINE] Task {task.id} failed: FILE MODIFIED (expected {task.file_size}, got {current_size})")
                        return
                except OSError as e:
                    task.status = QueueStatusEnum.failed
                    task.failure_reason = "SOURCE FILE NOT READABLE"
                    task.completed_at = datetime.utcnow()
                    db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.failed.value, message=task.failure_reason))
                    db.commit()
                    logger.error(f"[UPLOAD_ENGINE] Task {task.id} failed: Could not get file size ({e})")
                    return

            # Transition QUEUED -> UPLOADING
            task.status = QueueStatusEnum.uploading
            task.started_at = datetime.utcnow()
            db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.uploading.value, message="Starting upload process"))
            db.commit()
            logger.info(f"[UPLOAD_ENGINE] Task {task.id} is now UPLOADING")

            # Build context
            context = UploadContext(
                task=task,
                channel=channel,
                profile=None,
                browser_profile_path=channel.browser_profile or "youtube_automation",
                db_session=db,
                logger=logger,
                settings={}
            )

            # Resolve provider
            provider_name = channel.upload_provider or "api"
            try:
                provider = ProviderRegistry.get_provider(provider_name)
            except ValueError as e:
                raise Exception(f"Failed to resolve provider: {e}")

            logger.info(f"[UPLOAD_ENGINE] Using provider: {provider_name}")
            result = provider.upload(context)

            if result.success:
                task.youtube_video_id = result.youtube_video_id
                task.youtube_url = result.youtube_url
                db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.uploading.value, message=f"Video uploaded successfully. Video ID: {result.youtube_video_id}"))
                
                if result.thumbnail_uploaded:
                    db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.uploading.value, message="Thumbnail uploaded successfully"))
                
                # Transition UPLOADING -> COMPLETED
                task.status = QueueStatusEnum.completed
                task.completed_at = datetime.utcnow()
                db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.completed.value, message="Upload completed successfully"))
                db.commit()
                
                NotificationService.notify_upload_success(task.title or "Unknown Video")
                
                self._processed_tasks_count += 1
                logger.info(f"[UPLOAD_ENGINE] Task {task.id} YouTube upload COMPLETED")
            else:
                raise Exception(f"{result.error_code}: {result.error_message}")

        except Exception as e:
            logger.error(f"[UPLOAD_ENGINE] Error processing queue: {e}")
            db.rollback()
            if 'task' in locals() and task:
                try:
                    import socket
                    import httplib2
                    from googleapiclient.errors import HttpError
                    
                    def is_retryable_error(err: Exception) -> bool:
                        if isinstance(err, HttpError):
                            status = err.resp.status
                            if status in (500, 502, 503, 504):
                                return True
                            if status == 403:
                                content = str(err.content).lower() if hasattr(err, 'content') else ''
                                if 'quotaexceeded' in content or 'ratelimitexceeded' in content:
                                    return True
                            return False
                        if isinstance(err, (socket.timeout, TimeoutError, ConnectionResetError)):
                            return True
                        if isinstance(err, httplib2.ServerNotFoundError):
                            return True
                        return False

                    err_str = str(e)
                    err_lower = err_str.lower()
                    
                    def _get_friendly_error(raw_err: str) -> str:
                        if not raw_err:
                            return "Terjadi kendala saat proses upload."
                        low = raw_err.lower()
                        if "uploadlimitexceeded" in low or "exceeded the number of videos" in low:
                            return "Batas upload harian YouTube untuk channel ini sudah habis (Daily Limit Exceeded). YouTube membatasi jumlah video per hari. Silakan coba lagi besok (24 jam) atau gunakan channel lain."
                        if "invalidtags" in low or "invalid video keywords" in low:
                            return "Tags video melebihi batas maksimal YouTube (500 karakter). Harap kurangi tag pada editor metadata."
                        if "quotaexceeded" in low or "ratelimitexceeded" in low:
                            return "Kuota harian YouTube Data API channel ini telah habis. Tunggu reset kuota besok atau beralih ke provider Browser."
                        if "deleted_client" in low:
                            return "Client OAuth di Google Cloud terhapus. Silakan unggah ulang client_secret.json di menu Saluran/Channels."
                        if "invalid_grant" in low:
                            return "Sesi autentikasi Google kedaluwarsa atau dicabut. Silakan Hubungkan ulang (reconnect) di menu Saluran."
                        if "auth_required" in low or "oauth token not found" in low:
                            return "Channel belum terhubung dengan akun YouTube. Harap hubungkan akun di menu Saluran/Channels."
                        if "source file not found" in low or "file not found" in low:
                            return "File video tidak ditemukan di komputer. Pastikan drive/flashdisk terhubung."
                        if "source file not readable" in low:
                            return "File video tidak dapat dibaca karena izin file atau drive terputus."
                        if "connectionreseterror" in low or "10054" in low:
                            return "Koneksi internet terputus saat proses upload."
                        if "timed out" in low or "timeouterror" in low:
                            return "Waktu koneksi upload habis (Timeout). Periksa kestabilan internet Anda."

                        # Aggressive cleanup of raw code/traceback for any unknown error
                        import re
                        cleaned = raw_err.split("Traceback (most recent call last):")[0].strip()
                        msg_match = re.search(r"['\"]message['\"]\s*:\s*['\"]([^'\"]+)['\"]", cleaned)
                        if msg_match:
                            return msg_match.group(1)
                        ret_match = re.search(r'returned\s+"([^"]+)"', cleaned)
                        if ret_match:
                            return ret_match.group(1)
                        
                        cleaned = re.sub(r'^(API_UPLOAD_ERROR|PLAYWRIGHT_UPLOAD_ERROR|Exception):\s*', '', cleaned, flags=re.IGNORECASE)
                        cleaned = re.sub(r'<HttpError \d+ when requesting [^>]+>', '', cleaned).strip()
                        if "File \"" in cleaned or "line " in cleaned or len(cleaned) == 0:
                            return "Terjadi kendala saat upload. Silakan coba sesaat lagi."
                        return cleaned[:160]

                    friendly_error = _get_friendly_error(err_str)
                    is_retryable = True
                    # Non-retryable errors: daily upload limit, metadata validation errors, auth issues
                    if ("auth_required" in err_lower or "unauthorized" in err_lower or "oauth token not found" in err_lower
                        or "invalidtags" in err_lower or "invalid video keywords" in err_lower
                        or "deleted_client" in err_lower
                        or "uploadlimitexceeded" in err_lower or "exceeded the number of videos" in err_lower):
                        is_retryable = False
                        
                    current_retry = getattr(task, 'retry_count', 0)
                    
                    settings = db.query(GlobalSettings).first()
                    MAX_RETRIES = settings.upload_retry if settings else 3
                    
                    RETRY_DELAYS = {1: 60, 2: 300, 3: 900} # seconds

                    if is_retryable and current_retry < MAX_RETRIES:
                        next_retry = current_retry + 1
                        delay_seconds = RETRY_DELAYS.get(next_retry, 900)
                        
                        task.retry_count = next_retry
                        task.status = QueueStatusEnum.scheduled
                        task.scheduled_at = datetime.utcnow() + __import__('datetime').timedelta(seconds=delay_seconds)
                        task.failure_reason = friendly_error
                        
                        delay_mins = delay_seconds // 60
                        log_msg = f"Percobaan {next_retry}/{MAX_RETRIES} | Retry dalam {delay_mins} menit | Alasan: {friendly_error}"
                        db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.scheduled.value, message=log_msg))
                        db.commit()
                        logger.info(f"[UPLOAD_ENGINE] Task {task.id} SCHEDULED for retry {next_retry}/{MAX_RETRIES} in {delay_mins}m: {friendly_error}")
                        NotificationService.notify_upload_failed(task.title or "Unknown Video", f"Percobaan {next_retry} tertunda: {friendly_error}")
                    else:
                        # Non-retryable or max retries reached
                        task.status = QueueStatusEnum.failed
                        task.failure_reason = friendly_error
                            
                        task.completed_at = datetime.utcnow()
                        db.add(UploadLog(task_id=task.id, status=QueueStatusEnum.failed.value, message=f"Task failed: {task.failure_reason}"))
                        db.commit()
                        logger.info(f"[UPLOAD_ENGINE] Task {task.id} marked as FAILED: {task.failure_reason}")
                        
                        NotificationService.notify_upload_failed(task.title or "Unknown Video", task.failure_reason)
                except Exception as inner_e:
                    logger.error(f"[UPLOAD_ENGINE] Critical error trying to mark task {task.id} as failed/scheduled: {inner_e}")
                    db.rollback()
        finally:
            db.close()

_engine_instance = None

def get_engine() -> UploadEngine:
    global _engine_instance
    if _engine_instance is None:
        _engine_instance = UploadEngine()
    return _engine_instance
