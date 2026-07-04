from sqlalchemy.orm import Session
from .dashboard import DashboardAggregator

class DashboardService:
    @staticmethod
    def get_dashboard_data(db: Session, engine_health: dict):
        return DashboardAggregator.build(db, engine_health)
