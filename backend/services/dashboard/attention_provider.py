from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import UploadTask, Account
from schemas import QueueStatusEnum

class AttentionProvider:
    @staticmethod
    def get_attention(db: Session, limit: int = 10) -> dict:
        pending = db.query(
            UploadTask.id, UploadTask.title, UploadTask.account_id, UploadTask.status, UploadTask.created_at
        ).filter(
            UploadTask.status == QueueStatusEnum.review
        ).order_by(desc(UploadTask.created_at)).limit(limit).all()
        
        failed = db.query(
            UploadTask.id, UploadTask.title, UploadTask.account_id, UploadTask.status, UploadTask.failure_reason, UploadTask.created_at
        ).filter(
            UploadTask.status == QueueStatusEnum.failed
        ).order_by(desc(UploadTask.created_at)).limit(limit).all()
        
        accounts = {a.id: a.channel_name for a in db.query(Account).all()}
        
        def format_task(t, is_failed=False):
            data = {
                "id": t.id,
                "title": t.title or "Untitled Task",
                "video_id": "N/A",
                "platform": accounts.get(t.account_id, "YouTube"),
                "status": t.status.value if hasattr(t.status, 'value') else t.status
            }
            if is_failed and hasattr(t, 'failure_reason'):
                data["error"] = t.failure_reason
            return data
        
        return {
            "pending_review": [format_task(t) for t in pending],
            "failed": [format_task(t, is_failed=True) for t in failed]
        }
