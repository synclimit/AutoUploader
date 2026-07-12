from .base import IAnalyticsProvider
from typing import Dict, Any, Optional

class TikTokPlugin(IAnalyticsProvider):
    """
    TikTok Analytics Provider Placeholder.
    """
    def get_channel_metrics(self, channel_id: str, credentials: Any = None) -> Dict[str, Any]:
        raise NotImplementedError("TikTok integration coming soon.")
        
    def get_analytics_metrics(self, channel_id: str, credentials: Any = None) -> Dict[str, Any]:
        raise NotImplementedError("TikTok integration coming soon.")
        
    def get_chart_data(self, channel_id: str, days: int, credentials: Any = None) -> Dict[str, Any]:
        raise NotImplementedError("TikTok integration coming soon.")
        
    def get_videos(self, channel_id: str, page_token: Optional[str], limit: int, credentials: Any = None) -> Dict[str, Any]:
        raise NotImplementedError("TikTok integration coming soon.")
