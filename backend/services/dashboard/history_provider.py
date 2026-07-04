from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import UploadTask, Account
from schemas import QueueStatusEnum

class HistoryProvider:
    @staticmethod
    def get_history(db: Session, limit: int = 5) -> dict:
        completed = db.query(
            UploadTask.id, UploadTask.title, UploadTask.account_id, UploadTask.video_id, UploadTask.status, UploadTask.completed_at
        ).filter(
            UploadTask.status == QueueStatusEnum.completed
        ).order_by(desc(UploadTask.completed_at)).limit(limit).all()
        
        failed = db.query(
            UploadTask.id, UploadTask.title, UploadTask.account_id, UploadTask.video_id, UploadTask.status, UploadTask.completed_at, UploadTask.created_at
        ).filter(
            UploadTask.status == QueueStatusEnum.failed
        ).order_by(desc(UploadTask.created_at)).limit(limit).all()
        
        accounts = {a.id: a.channel_name for a in db.query(Account).all()}
        
        def format_task(t, account_name="YouTube"):
            return {
                "id": t.id,
                "title": t.title or "Untitled Task",
                "video_id": t.video_id or "N/A",
                "platform": account_name,
                "status": t.status.value.lower() if hasattr(t.status, 'value') else str(t.status).lower(),
                "completed_at": t.completed_at.isoformat() if hasattr(t, 'completed_at') and t.completed_at else None
            }
            
        last_upload_time = completed[0].completed_at.isoformat() if completed and completed[0].completed_at else None
        
        return {
            "latest_completed": [format_task(t, accounts.get(t.account_id, "YouTube")) for t in completed],
            "latest_failed": [format_task(t, accounts.get(t.account_id, "YouTube")) for t in failed],
            "last_upload_time": last_upload_time
        }
