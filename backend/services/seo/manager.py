import urllib.parse
from typing import Dict, Any, Type
from .base import BaseSEOProvider
from .vidiq_provider import VidIQProvider

class SEOManager:
    """
    Manages SEO Validation Providers.
    """
    _providers: Dict[str, Type[BaseSEOProvider]] = {
        "vidiq": VidIQProvider,
        # Future providers can be added here
        # "tubebuddy": TubeBuddyProvider,
        # "google_search": GoogleSearchProvider,
    }

    @classmethod
    def get_provider(cls, name: str) -> BaseSEOProvider:
        name = name.lower()
        if name not in cls._providers:
            # Fallback to vidiq if unknown
            return VidIQProvider()
        return cls._providers[name]()

    @classmethod
    def validate(cls, mode: str, keyword: str = None, video_id: str = None, provider_name: str = "vidiq") -> dict:
        """
        Executes the validation based on mode.
        modes: 'studio', 'search'
        """
        provider = cls.get_provider(provider_name)
        
        if mode == "studio":
            return provider.open_studio_mode(video_id)
        elif mode == "search":
            if not keyword:
                raise ValueError("Keyword is required for search mode")
            return provider.open_search_mode(keyword)
        else:
            raise ValueError(f"Unknown validation mode: {mode}")

    @classmethod
    def copy_url(cls, mode: str, keyword: str = None, video_id: str = None) -> dict:
        """
        Helper method to return the URL string directly (useful for copying to clipboard).
        While the client can construct it, having it centrally ensures consistency.
        """
        if mode == "studio":
            url = f"https://studio.youtube.com/video/{video_id}/edit" if video_id else "https://studio.youtube.com"
            return {"success": True, "url": url}
        elif mode == "search":
            if not keyword:
                raise ValueError("Keyword is required for search mode")
            encoded = urllib.parse.quote_plus(keyword)
            url = f"https://www.youtube.com/results?search_query={encoded}"
            return {"success": True, "url": url}
        else:
            raise ValueError(f"Unknown validation mode: {mode}")
