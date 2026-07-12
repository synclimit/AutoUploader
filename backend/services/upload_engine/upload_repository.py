from sqlalchemy.orm import Session
from datetime import datetime
from models import UploadTask, UploadLog
from .upload_progress import UploadProgress
from .upload_state_machine import UploadState
from .upload_result import UploadResult

class UploadRepository:
    """
    Tanggung jawab:
    Menjembatani akses Upload Manager ke database.
    """
    
    @staticmethod
    def update_task_state(db: Session, task_id: str, state: UploadState) -> None:
        try:
            task = db.query(UploadTask).filter_by(id=task_id).first()
            if task:
                task.status = state.value
                db.commit()
        except Exception as e:
            db.rollback()

    @staticmethod
    def log_progress(db: Session, task_id: str, progress: UploadProgress) -> None:
        try:
            task = db.query(UploadTask).filter_by(id=task_id).first()
            if task:
                task.upload_progress = int(progress.progress_percentage)
                
                log = UploadLog(
                    task_id=task_id,
                    status=progress.status.value,
                    message=progress.message
                )
                db.add(log)
                db.commit()
        except Exception:
            db.rollback()

    @staticmethod
    def save_result(db: Session, task_id: str, result: UploadResult) -> None:
        try:
            task = db.query(UploadTask).filter_by(id=task_id).first()
            if task:
                task.completed_at = result.finished_at
                if result.success:
                    task.status = UploadState.SUCCESS.value
                    task.youtube_video_id = result.video_id
                else:
                    task.status = UploadState.FAILED.value
                    task.failure_reason = result.error_message
                
                log = UploadLog(
                    task_id=task_id,
                    status=task.status,
                    message=result.error_message if not result.success else f"Uploaded: {result.video_id}"
                )
                db.add(log)
                db.commit()
        except Exception:
            db.rollback()
