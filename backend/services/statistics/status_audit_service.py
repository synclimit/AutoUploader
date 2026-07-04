from sqlalchemy.orm import Session
from models import UploadTask
from schemas import QueueStatusEnum
import logging

class StatusAuditService:
    @staticmethod
    def audit(db: Session) -> dict:
        """
        Audit Formula: Review + Queue + Uploading + Complete = Total UploadTask
        Returns a warning message if there is a mismatch.
        """
        
        # Valid tracking statuses based on SSOT Architecture
        review_statuses = [
            QueueStatusEnum.watched,
            QueueStatusEnum.review,
            QueueStatusEnum.scheduled,
            QueueStatusEnum.queued # Before upload begins, QUEUED counts in Review Workspace logic
        ]
        
        # Queue/Uploading are active
        uploading_statuses = [
            QueueStatusEnum.uploading
        ]
        
        # Complete are final states
        complete_statuses = [
            QueueStatusEnum.completed,
            QueueStatusEnum.failed,
            QueueStatusEnum.cancelled
        ]

        total_tasks = db.query(UploadTask.id).count()
        
        # Calculate sum of all known valid states
        tracked_statuses = review_statuses + uploading_statuses + complete_statuses
        
        tracked_count = db.query(UploadTask.id).filter(
            UploadTask.status.in_(tracked_statuses)
        ).count()
        
        is_healthy = total_tasks == tracked_count
        
        if not is_healthy:
            logging.warning("WARNING: UploadTask Status Mismatch")
            return {
                "healthy": False,
                "message": "WARNING: UploadTask Status Mismatch",
                "total": total_tasks,
                "tracked": tracked_count
            }
            
        return {
            "healthy": True,
            "message": "System Healthy",
            "total": total_tasks,
            "tracked": tracked_count
        }
