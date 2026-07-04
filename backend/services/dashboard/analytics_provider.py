from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from models import UploadTask
from schemas import QueueStatusEnum

class AnalyticsProvider:
    @staticmethod
    def get_analytics(db: Session, period_days: int = 7) -> dict:
        cutoff = datetime.utcnow() - timedelta(days=period_days)
        tasks = db.query(UploadTask.id, UploadTask.status, UploadTask.created_at).filter(
            UploadTask.created_at >= cutoff
        ).all()
        
        # Initialize dates
        dates = [(datetime.utcnow() - timedelta(days=i)).strftime('%a') for i in range(period_days-1, -1, -1)]
        data = {d: {"uploads": 0, "completed": 0, "failed": 0} for d in dates}
        
        for t in tasks:
            d_str = t.created_at.strftime('%a')
            if d_str in data:
                data[d_str]["uploads"] += 1
                if t.status == QueueStatusEnum.completed:
                    data[d_str]["completed"] += 1
                elif t.status == QueueStatusEnum.failed:
                    data[d_str]["failed"] += 1
        
        return {
            "period": f"{period_days}d",
            "labels": dates,
            "uploads": [data[d]["uploads"] for d in dates],
            "completed": [data[d]["completed"] for d in dates],
            "failed": [data[d]["failed"] for d in dates]
        }
