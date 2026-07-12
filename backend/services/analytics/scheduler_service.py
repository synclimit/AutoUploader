import asyncio
from typing import Dict, Any, Callable
import time

class AnalyticsScheduler:
    """
    Intelligent Scheduler.
    Only polls when UI is active.
    Stops immediately when UI is closed.
    """
    def __init__(self):
        self.active_tasks: Dict[str, asyncio.Task] = {}
        self.polling_interval = 300 # 5 minutes by default
        
    def start_polling(self, channel_id: str, account_type: str, credentials: Any, refresh_callback: Callable):
        if channel_id in self.active_tasks:
            return # Already polling
            
        async def poll_loop():
            while True:
                await asyncio.sleep(self.polling_interval)
                try:
                    await refresh_callback()
                except Exception as e:
                    print(f"Scheduler error for {channel_id}: {e}")
                    # Exponential backoff on errors will be handled by AnalyticsService
                    
        self.active_tasks[channel_id] = asyncio.create_task(poll_loop())
        
    def stop_polling(self, channel_id: str):
        if channel_id in self.active_tasks:
            self.active_tasks[channel_id].cancel()
            del self.active_tasks[channel_id]

scheduler_service = AnalyticsScheduler()
