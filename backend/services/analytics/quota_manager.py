import time
from typing import Dict, Any

class QuotaManager:
    """
    Manages API Quota Limits and Refresh Cooldowns.
    """
    def __init__(self):
        # 10s cooldown for manual refresh per channel
        self.cooldown_period = 10 
        self.last_refresh: Dict[str, float] = {}
        
        self.usage_today = 0
        self.daily_limit = 10000
        
    def can_refresh(self, channel_id: str) -> bool:
        if channel_id in self.last_refresh:
            if time.time() - self.last_refresh[channel_id] < self.cooldown_period:
                return False
        return True
        
    def record_refresh(self, channel_id: str):
        self.last_refresh[channel_id] = time.time()
        
    def record_api_call(self, cost: int = 1):
        self.usage_today += cost
        
    def get_quota_stats(self) -> Dict[str, Any]:
        return {
            "usage": self.usage_today,
            "limit": self.daily_limit,
            "remaining": max(0, self.daily_limit - self.usage_today)
        }

quota_manager = QuotaManager()
