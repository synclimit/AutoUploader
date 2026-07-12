from typing import Dict, Any
from .analytics_service import analytics_service

class AnalyticsGateway:
    """
    Single Entry Point for all Analytics requests.
    Enforces validation and routing.
    """
    
    async def get_dashboard(self, channel_id: str, account_type: str, credentials: Any, force_refresh: bool = False) -> Dict[str, Any]:
        if not channel_id or not credentials:
            raise ValueError("Invalid parameters")
        return await analytics_service.get_dashboard_metrics(channel_id, account_type, credentials, force_refresh)
        
    async def get_overview(self, channel_id: str, account_type: str, credentials: Any, force_refresh: bool = False) -> Dict[str, Any]:
        if not channel_id or not credentials:
            raise ValueError("Invalid parameters")
        return await analytics_service.get_overview_metrics(channel_id, account_type, credentials, force_refresh)
        
    async def get_charts(self, channel_id: str, account_type: str, days: int, credentials: Any, force_refresh: bool = False) -> Dict[str, Any]:
        if not channel_id or not credentials or days <= 0:
            raise ValueError("Invalid parameters")
        return await analytics_service.get_charts(channel_id, account_type, days, credentials, force_refresh)

analytics_gateway = AnalyticsGateway()
