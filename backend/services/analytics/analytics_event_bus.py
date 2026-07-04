import asyncio
from typing import Dict, Any, Callable, List

class AnalyticsEventBus:
    """
    Event Bus strictly for Analytics events.
    Allowed events: AnalyticsUpdated, ChartUpdated, QuotaUpdated, CacheUpdated, ProviderHealthChanged.
    """
    def __init__(self):
        self.subscribers: Dict[str, List[Callable]] = {
            "AnalyticsUpdated": [],
            "ChartUpdated": [],
            "QuotaUpdated": [],
            "CacheUpdated": [],
            "ProviderHealthChanged": []
        }

    def subscribe(self, event_type: str, callback: Callable):
        if event_type in self.subscribers:
            self.subscribers[event_type].append(callback)

    def unsubscribe(self, event_type: str, callback: Callable):
        if event_type in self.subscribers:
            self.subscribers[event_type].remove(callback)

    async def publish(self, event_type: str, payload: Dict[str, Any]):
        """
        Publish an event to all subscribers asynchronously.
        """
        if event_type not in self.subscribers:
            return
            
        for callback in self.subscribers[event_type]:
            if asyncio.iscoroutinefunction(callback):
                asyncio.create_task(callback(payload))
            else:
                callback(payload)

event_bus = AnalyticsEventBus()
