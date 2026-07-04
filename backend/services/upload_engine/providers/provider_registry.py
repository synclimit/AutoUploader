from typing import Dict, Type
from .base_provider import BaseUploader

class ProviderRegistry:
    _providers: Dict[str, Type[BaseUploader]] = {}

    @classmethod
    def register(cls, name: str, provider_class: Type[BaseUploader]):
        cls._providers[name] = provider_class

    @classmethod
    def get_provider(cls, name: str) -> BaseUploader:
        provider_class = cls._providers.get(name)
        if not provider_class:
            raise ValueError(f"Provider '{name}' not found in registry.")
        return provider_class()  # Return fresh stateless instance
