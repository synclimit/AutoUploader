from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import UploadTask, UploadLog, Account
from schemas import QueueStatusEnum

class HistoryService:
    @staticmethod
    def get_history(db: Session):
        tasks = (
            db.query(UploadTask)
            .filter(UploadTask.status.in_([
                QueueStatusEnum.completed, 
                QueueStatusEnum.failed, 
                QueueStatusEnum.cancelled
            ]))
            .order_by(desc(UploadTask.created_at))
            .all()
        )
        
        total_uploads = db.query(UploadTask).count()
        success_count = db.query(UploadTask).filter(UploadTask.status == QueueStatusEnum.completed).count()
        failed_count = db.query(UploadTask).filter(UploadTask.status == QueueStatusEnum.failed).count()
        success_rate = (success_count / total_uploads * 100) if total_uploads > 0 else 0
        
        recent_logs = (
            db.query(UploadLog)
            .order_by(desc(UploadLog.created_at))
            .limit(10)
            .all()
        )
        logs_formatted = [f"[{log.created_at.strftime('%H:%M')}] {log.message}" for log in recent_logs]

        items = []
        for task in tasks:
            account = db.query(Account).filter(Account.id == task.account_id).first()
            channel_name = account.channel_name if account else "Unknown Channel"
            
            dt = task.completed_at or task.created_at
            
            items.append({
                "id": task.id,
                "title": task.title or "Untitled Upload",
                "channel": channel_name,
                "status": "SUCCESS" if task.status == QueueStatusEnum.completed else "FAILED",
                "views": "N/A",
                "duration": "N/A",
                "date": dt.strftime("%A, %d %b %Y"),
                "time": dt.strftime("%H:%M"),
                "source": task.source_type,
                "retry": f"{task.retry_count} Retry" if task.retry_count > 0 else "0 Retry",
                "mode": task.metadata_source,
                "thumbnail": task.thumbnail_path,
                "youtube_url": task.youtube_url
            })
            
        stats = [
            {"title": "Total Upload History", "value": str(total_uploads), "change": "All time", "color": "text-cyan-300"},
            {"title": "Success Uploads", "value": f"{success_rate:.1f}%", "change": f"{success_count} success", "color": "text-green-300"},
            {"title": "Failed Uploads", "value": str(failed_count), "change": "Needs attention", "color": "text-red-300"},
        ]

        return {
            "items": items,
            "stats": stats,
            "logs": logs_formatted
        }
