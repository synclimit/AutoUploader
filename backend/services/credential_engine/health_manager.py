from sqlalchemy.orm import Session
from sqlalchemy import text
from .types import HealthStatus

class HealthManager:
    """
    Tanggung jawab:
    - refresh status
    - cek status
    - ubah status
    - laporkan status
    """
    
    @classmethod
    def get_status(cls, db: Session, channel_id: str) -> HealthStatus:
        query = "SELECT health_status FROM channels WHERE id = :id"
        result = db.execute(text(query), {"id": channel_id}).scalar()
        if not result:
            return HealthStatus.UNKNOWN
            
        try:
            return HealthStatus(result)
        except ValueError:
            return HealthStatus.UNKNOWN
            
    @classmethod
    def update_status(cls, db: Session, channel_id: str, status: HealthStatus) -> None:
        query = "UPDATE channels SET health_status = :status WHERE id = :id"
        db.execute(text(query), {"status": status.value, "id": channel_id})
        db.commit()
