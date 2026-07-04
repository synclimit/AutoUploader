from sqlalchemy.orm import Session
from models import UploadTask
from schemas import QueueStatusEnum
from datetime import datetime, timedelta

class StatisticsProvider:
    @staticmethod
    def get_statistics(db: Session) -> dict:
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        stats = {
            "review": db.query(UploadTask.id).filter(UploadTask.status == QueueStatusEnum.review).count(),
            "watched": db.query(UploadTask.id).filter(UploadTask.status == QueueStatusEnum.watched).count(),
            "queued": db.query(UploadTask.id).filter(UploadTask.status == QueueStatusEnum.queued).count(),
            "scheduled": db.query(UploadTask.id).filter(UploadTask.status == QueueStatusEnum.scheduled).count(),
            "uploading": db.query(UploadTask.id).filter(UploadTask.status == QueueStatusEnum.uploading).count(),
            "completed": db.query(UploadTask.id).filter(UploadTask.status == QueueStatusEnum.completed).count(),
            "completed_today": db.query(UploadTask.id).filter(
                UploadTask.status == QueueStatusEnum.completed,
                UploadTask.completed_at >= today_start
            ).count(),
            "completed_this_week": db.query(UploadTask.id).filter(
                UploadTask.status == QueueStatusEnum.completed,
                UploadTask.completed_at >= today_start - timedelta(days=7)
            ).count(),
            "failed": db.query(UploadTask.id).filter(UploadTask.status == QueueStatusEnum.failed).count(),
            "cancelled": db.query(UploadTask.id).filter(UploadTask.status == QueueStatusEnum.cancelled).count(),
            "all_status": db.query(UploadTask.id).count()
        }

        # Validation Rule
        sum_of_statuses = (
            stats["review"] + stats["watched"] + stats["queued"] +
            stats["scheduled"] + stats["uploading"] + stats["completed"] +
            stats["failed"] + stats["cancelled"]
        )
        if sum_of_statuses != stats["all_status"]:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(
                f"[DATA INTEGRITY WARNING] Status count mismatch! "
                f"Sum of statuses ({sum_of_statuses}) != All Status ({stats['all_status']}). "
                f"A task may have an invalid or null status."
            )

        return stats
