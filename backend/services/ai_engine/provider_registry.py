from typing import Type, Dict
from .providers.base import BaseAIProvider
from .providers.gemini import GeminiProvider
from .providers.openai import OpenAIProvider
from .providers.openai_compatible import OpenAICompatibleProvider
from .providers.atomesus import AtomesusProvider
from .providers.opencode import OpenCodeProvider

class AIProviderRegistry:
    """
    Factory registry to dynamically load AI providers without massive if/else chains.
    """
    _providers: Dict[str, Type[BaseAIProvider]] = {
        "gemini": GeminiProvider,
        "openai": OpenAIProvider,
        "openai_compatible": OpenAICompatibleProvider,
        "atomesus": AtomesusProvider,
        "opencode": OpenCodeProvider,
    }

    @classmethod
    def get_provider_class(cls, name: str) -> Type[BaseAIProvider]:
        name_lower = name.lower()
        if name_lower not in cls._providers:
            raise ValueError(f"Unknown AI Provider: {name}")
        return cls._providers[name_lower]

    @classmethod
    def register_provider(cls, name: str, provider_class: Type[BaseAIProvider]):
        cls._providers[name.lower()] = provider_class
