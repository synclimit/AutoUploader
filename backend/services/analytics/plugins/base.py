from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class IAnalyticsProvider(ABC):
    """
    Interface for Analytics Providers.
    All platform plugins (YouTube, TikTok, etc.) must implement this interface.
    """
    
    @abstractmethod
    def get_channel_metrics(self, account_id: str, credentials: Any = None) -> Dict[str, Any]:
        """
        Fetch high-level channel metrics (Subscribers, Views, Total Videos, Status).
        Must return a standardized dictionary.
        """
        pass
        
    @abstractmethod
    def get_analytics_metrics(self, account_id: str, credentials: Any = None) -> Dict[str, Any]:
        """
        Fetch heavy analytics metrics (Watch Time, Impressions, CTR, Avg View Duration).
        """
        pass
        
    @abstractmethod
    def get_chart_data(self, account_id: str, days: int, credentials: Any = None) -> Dict[str, Any]:
        """
        Fetch time-series data for charts.
        """
        pass
        
    @abstractmethod
    def get_videos(self, account_id: str, page_token: Optional[str], limit: int, credentials: Any = None) -> Dict[str, Any]:
        """
        Fetch paginated video list with their individual analytics.
        """
        pass
