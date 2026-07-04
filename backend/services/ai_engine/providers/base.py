from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional

class BaseAIProvider(ABC):
    """
    Abstract base class for all AI providers.
    Ensures all providers implement the required generic AI interface.
    """
    
    def __init__(self, api_key: str, base_url: Optional[str] = None, model: Optional[str] = None, **kwargs):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model
        self.kwargs = kwargs

    @abstractmethod
    async def generate(self, task: str, prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Execute a generic text generation task.
        """
        pass

    @abstractmethod
    async def generate_stream(self, task: str, prompt: str, context: Optional[Dict[str, Any]] = None):
        """
        Execute a generic text generation task, yielding chunks.
        """
        pass

    @abstractmethod
    async def test_connection(self) -> Dict[str, Any]:
        """
        Test the connection to the provider.
        Should return: Provider, Model, Endpoint, Latency, Authentication, Error message (if any).
        """
        pass

    @abstractmethod
    async def get_models(self) -> List[str]:
        """
        Retrieve available models for this provider.
        """
        pass

    @property
    @abstractmethod
    def capabilities(self) -> List[str]:
        """
        Return a list of AI capabilities supported by this provider.
        e.g., ['metadata', 'seo', 'streaming', 'models', 'json_mode']
        """
        pass
