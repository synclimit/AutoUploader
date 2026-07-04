import time
from typing import Dict, Any, List, Optional
from core.http_client import AIHttpClient
from .openai_compatible import OpenAICompatibleProvider

class OpenAIProvider(OpenAICompatibleProvider):
    """
    Native OpenAI Provider leveraging the compatible base class.
    Forces the base URL to OpenAI's official endpoint if not set.
    """
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None, **kwargs):
        super().__init__(api_key=api_key, base_url=base_url, model=model, **kwargs)
        self.provider_name = "OpenAI"

    def _get_url(self, endpoint: str) -> str:
        base = self.base_url.rstrip("/") if self.base_url else "https://api.openai.com/v1"
        return f"{base}{endpoint}"
