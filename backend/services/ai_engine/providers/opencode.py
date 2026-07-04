from typing import Dict, Any, Optional
from .openai_compatible import OpenAICompatibleProvider

class OpenCodeProvider(OpenAICompatibleProvider):
    """
    OpenCode AI Provider leveraging the compatible base class.
    Forces the base URL to OpenCode's official endpoint and model if not set.
    """
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None, **kwargs):
        super().__init__(
            api_key=api_key,
            base_url=base_url or "https://api.opencode.ai/v1",
            model=model or "opencode-1",
            **kwargs
        )
        self.provider_name = "Opencode"

    def _get_url(self, endpoint: str) -> str:
        base = self.base_url.rstrip("/") if self.base_url else "https://api.opencode.ai/v1"
        return f"{base}{endpoint}"
