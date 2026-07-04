from typing import Dict, Any

class AnalyticsMapper:
    """
    Standardizes raw API responses into clean JSON for the frontend.
    """
    
    @staticmethod
    def map_channel_metrics(raw_data: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "subscribers": raw_data.get("subscribers", 0),
            "views": raw_data.get("views", 0),
            "videos": raw_data.get("videos", 0)
        }
        
    @staticmethod
    def map_dashboard_metrics(channel_metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Dashboard only requests Lightweight metrics.
        """
        # Note: In reality, we combine with UploadTask data (Queue, Status) at the endpoint.
        # But for the analytics portion, we just return the channel metrics.
        return {
            "subs": channel_metrics.get("subscribers", 0),
            "views": channel_metrics.get("views", 0),
            "ctr": channel_metrics.get("ctr", 0), # Will be combined later
            "videos": channel_metrics.get("videos", 0)
        }

analytics_mapper = AnalyticsMapper()
