import time
from typing import List, Dict, Tuple, Optional

class ModelCache:
    """
    In-memory cache for provider models.
    TTL defaults to 300 seconds (5 minutes).
    """
    _cache: Dict[str, Tuple[float, List[str]]] = {}
    _ttl: int = 300

    @classmethod
    def _generate_key(cls, provider: str, api_key: Optional[str], base_url: Optional[str]) -> str:
        return f"{provider}_{api_key or ''}_{base_url or ''}"

    @classmethod
    def get(cls, provider: str, api_key: Optional[str], base_url: Optional[str]) -> Optional[List[str]]:
        key = cls._generate_key(provider, api_key, base_url)
        if key in cls._cache:
            timestamp, models = cls._cache[key]
            if time.time() - timestamp <= cls._ttl:
                return models
            else:
                del cls._cache[key]
        return None

    @classmethod
    def set(cls, provider: str, api_key: Optional[str], base_url: Optional[str], models: List[str]):
        key = cls._generate_key(provider, api_key, base_url)
        cls._cache[key] = (time.time(), models)

    @classmethod
    def clear(cls):
        cls._cache.clear()
