import time
from collections import OrderedDict
from typing import Any, Dict, Optional, Tuple

class LRUCache:
    def __init__(self, capacity: int, ttl_seconds: int):
        self.cache: OrderedDict[str, Tuple[float, Any]] = OrderedDict()
        self.capacity = capacity
        self.ttl_seconds = ttl_seconds
        
        # Stats
        self.hits = 0
        self.misses = 0
        self.total_fetch_time_ms = 0
        self.fetch_count = 0

    def get(self, key: str) -> Optional[Any]:
        if key not in self.cache:
            self.misses += 1
            return None
            
        timestamp, value = self.cache[key]
        if time.time() - timestamp > self.ttl_seconds:
            # Expired
            self.misses += 1
            del self.cache[key]
            return None
            
        self.cache.move_to_end(key)
        self.hits += 1
        return value

    def put(self, key: str, value: Any, fetch_time_ms: float = 0):
        self.cache[key] = (time.time(), value)
        self.cache.move_to_end(key)
        
        if fetch_time_ms > 0:
            self.total_fetch_time_ms += fetch_time_ms
            self.fetch_count += 1
            
        if len(self.cache) > self.capacity:
            self.cache.popitem(last=False)

    def invalidate(self, key: str):
        if key in self.cache:
            del self.cache[key]
            
    def get_stats(self) -> Dict[str, Any]:
        return {
            "size": len(self.cache),
            "capacity": self.capacity,
            "hits": self.hits,
            "misses": self.misses,
            "hit_rate": (self.hits / (self.hits + self.misses) * 100) if (self.hits + self.misses) > 0 else 0,
            "avg_fetch_time_ms": (self.total_fetch_time_ms / self.fetch_count) if self.fetch_count > 0 else 0
        }

class AnalyticsCacheService:
    """
    Multi-Level Cache Manager for Analytics.
    Enforces maximum memory limits using LRU eviction.
    TTL is 10 minutes (600 seconds) for analytics/charts/quota.
    """
    def __init__(self):
        # Max 100 Channels
        self.analytics_cache = LRUCache(capacity=100, ttl_seconds=600)
        # Max 200 Datasets
        self.chart_cache = LRUCache(capacity=200, ttl_seconds=600)
        # Max 20 Channels (Cursor based, so maybe key is channel_id_cursor)
        self.video_cache = LRUCache(capacity=20, ttl_seconds=60) # Shorter TTL for video list
        # Quota cache
        self.quota_cache = LRUCache(capacity=10, ttl_seconds=600)

cache_service = AnalyticsCacheService()
