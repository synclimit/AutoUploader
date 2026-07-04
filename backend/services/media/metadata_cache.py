import os
from collections import OrderedDict
from typing import Optional, Dict, Any

class MetadataCache:
    """
    LRU Memory Cache for Video Metadata with modified time invalidation.
    Max capacity set to 500 entries to prevent memory leaks.
    """
    
    def __init__(self, max_capacity: int = 500):
        self.max_capacity = max_capacity
        # OrderedDict used for LRU implementation
        self.cache: OrderedDict = OrderedDict()

    def _get_mtime(self, video_path: str) -> Optional[float]:
        try:
            return os.path.getmtime(video_path)
        except OSError:
            return None

    def get(self, video_path: str) -> Optional[Dict[str, Any]]:
        if video_path not in self.cache:
            return None

        entry = self.cache[video_path]
        current_mtime = self._get_mtime(video_path)

        # Invalidate if file has been modified or deleted
        if current_mtime is None or entry['mtime'] != current_mtime:
            self._invalidate(video_path)
            return None

        # Move to end to mark as recently used
        self.cache.move_to_end(video_path)
        return entry['data']

    def set(self, video_path: str, data: Dict[str, Any]) -> None:
        current_mtime = self._get_mtime(video_path)
        if current_mtime is None:
            return  # Don't cache if file doesn't exist

        if video_path in self.cache:
            self.cache.move_to_end(video_path)
        else:
            if len(self.cache) >= self.max_capacity:
                # Evict oldest (first) item
                self.cache.popitem(last=False)
                
        self.cache[video_path] = {
            'mtime': current_mtime,
            'data': data
        }

    def _invalidate(self, video_path: str) -> None:
        if video_path in self.cache:
            del self.cache[video_path]

# Singleton instance
metadata_cache_instance = MetadataCache()
