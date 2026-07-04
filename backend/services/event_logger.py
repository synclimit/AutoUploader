from sqlalchemy.orm import Session
from models import UploadLog
from schemas import QueueStatusEnum

class EventLogger:
    @staticmethod
    def log_event(db: Session, task_id: str, status: QueueStatusEnum, message: str):
        """
        Lightweight event logger that persists structured events into the UploadLog table.
        """
        log = UploadLog(
            task_id=task_id,
            status=status,
            message=message
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        return log
