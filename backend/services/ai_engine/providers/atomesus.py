from typing import Dict, Any, Optional
from .openai_compatible import OpenAICompatibleProvider

class AtomesusProvider(OpenAICompatibleProvider):
    """
    Atomesus AI Provider leveraging the compatible base class.
    Forces the base URL to Atomesus's official endpoint and model to cipher if not set.
    """
    def __init__(self, api_key: Optional[str] = None, base_url: Optional[str] = None, model: Optional[str] = None, **kwargs):
        super().__init__(
            api_key=api_key,
            base_url=base_url or "https://api.atomesus.com/v1",
            model=model or "cipher",
            **kwargs
        )
        self.provider_name = "Atomesus"

    def _get_url(self, endpoint: str) -> str:
        base = self.base_url.rstrip("/") if self.base_url else "https://api.atomesus.com/v1"
        return f"{base}{endpoint}"
