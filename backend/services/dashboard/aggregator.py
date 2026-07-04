from sqlalchemy.orm import Session
from datetime import datetime
from .statistics_provider import StatisticsProvider
from .channel_provider import ChannelProvider
from .attention_provider import AttentionProvider
from .analytics_provider import AnalyticsProvider
from .engine_provider import EngineProvider
from .history_provider import HistoryProvider
from services.statistics.status_audit_service import StatusAuditService

class DashboardAggregator:
    @staticmethod
    def build(db: Session, engine_state: dict) -> dict:
        return {
            "statistics": StatisticsProvider.get_statistics(db),
            "connected_channels": ChannelProvider.get_channels(db),
            "attention": AttentionProvider.get_attention(db),
            "analytics": AnalyticsProvider.get_analytics(db),
            "engine": EngineProvider.get_engine(engine_state),
            "history": HistoryProvider.get_history(db),
            "notification": StatusAuditService.audit(db),
            "meta": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "version": "1.0.0"
            }
        }
