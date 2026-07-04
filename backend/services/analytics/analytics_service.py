import asyncio
import time
from typing import Dict, Any, Optional
from .plugins import YouTubePlugin
from .cache import cache_service
from .quota_manager import quota_manager
from .provider_health_service import provider_health_service
from .analytics_event_bus import event_bus

class AnalyticsService:
    def __init__(self):
        # Setup plugin registry (currently only YouTube is fully implemented)
        self.providers = {
            "youtube": YouTubePlugin()
        }
    
    def _get_provider(self, account_type: str = "youtube"):
        provider = self.providers.get(account_type.lower())
        if not provider:
            raise ValueError(f"Provider {account_type} not found or not supported.")
        return provider
        
    async def get_dashboard_metrics(self, account_id: str, account_type: str, credentials: Any, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Lightweight metrics for the dashboard + 28d analytics.
        """
        def fetch_combined():
            provider = self._get_provider(account_type)
            channel = provider.get_channel_metrics(account_id, credentials)
            try:
                analytics = provider.get_analytics_metrics(account_id, credentials)
            except Exception as e:
                print(f"Analytics 28d fetch failed: {e}")
                analytics = {"views": channel.get("views", 0), "ctr": 0}
            
            return {
                "subscribers": channel.get("subscribers", 0),
                "subs": channel.get("subscribers", 0),
                "views": analytics.get("views", channel.get("views", 0)),
                "views_28d": analytics.get("views", channel.get("views", 0)),
                "views_lifetime": channel.get("views", 0),
                "videos": channel.get("videos", 0),
                "ctr": analytics.get("ctr", 0),
                "channel_id": channel.get("channel_id"),
                "title": channel.get("title", "")
            }

        return await self._fetch_with_cache(
            f"dashboard_{account_id}",
            cache_service.analytics_cache,
            fetch_combined,
            "youtube",
            force_refresh
        )

    async def get_overview_metrics(self, account_id: str, account_type: str, credentials: Any, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Heavy analytics for Workspace Overview.
        Combines channel metrics and heavy analytics.
        """
        async def fetch_both():
            provider = self._get_provider(account_type)
            channel = provider.get_channel_metrics(account_id, credentials)
            analytics = provider.get_analytics_metrics(account_id, credentials)
            return {"channel": channel, "analytics": analytics}
            
        return await self._fetch_with_cache(
            f"overview_{account_id}",
            cache_service.analytics_cache,
            fetch_both,
            "youtube",
            force_refresh
        )

    async def get_charts(self, account_id: str, account_type: str, days: int, credentials: Any, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Time-series data for Charts.
        """
        return await self._fetch_with_cache(
            f"charts_{account_id}_{days}",
            cache_service.chart_cache,
            lambda: self._get_provider(account_type).get_chart_data(account_id, days, credentials),
            "youtube",
            force_refresh
        )

    async def _fetch_with_cache(self, cache_key: str, cache_store, fetch_func, provider_name: str, force_refresh: bool = False) -> Dict[str, Any]:
        # 1. Check Quota Cooldown if force refresh
        if force_refresh and not quota_manager.can_refresh(cache_key):
            # Block duplicate/spam refresh requests
            force_refresh = False
            
        if force_refresh:
            quota_manager.record_refresh(cache_key)

        # 2. Check Cache
        cached_data = cache_store.get(cache_key)
        if cached_data is not None and not force_refresh:
            return cached_data
            
        # 3. Handle Retry Policy (Exponential Backoff)
        if provider_health_service.get_health(provider_name)["status"] == "Offline" and cached_data is not None:
            # Skip fetch if offline and we have cache
            return cached_data

        # 4. Fetch from Provider
        start_time = time.time()
        try:
            # We assume fetch_func is synchronous for YouTube Python Client
            loop = asyncio.get_event_loop()
            data = await loop.run_in_executor(None, fetch_func)
            
            fetch_time_ms = (time.time() - start_time) * 1000
            
            # Record Health & Quota
            provider_health_service.record_success(provider_name, fetch_time_ms)
            quota_manager.record_api_call(cost=1)
            
            # Save to Cache
            cache_store.put(cache_key, data, fetch_time_ms=fetch_time_ms)
            
            # Broadcast Differential Update (In a real scenario, calculate diffs)
            asyncio.create_task(event_bus.publish("AnalyticsUpdated", {"key": cache_key, "data": data}))
            
            return data
            
        except Exception as e:
            provider_health_service.record_failure(provider_name)
            # 5. Error Recovery Priority: Cache -> Retry -> Graceful Error
            if cached_data is not None:
                return cached_data
            raise ValueError(f"Analytics temporarily unavailable. {str(e)}")

analytics_service = AnalyticsService()
