import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from models import GlobalSettings
from .provider_registry import AIProviderRegistry
from .model_cache import ModelCache

logger = logging.getLogger(__name__)

class AIEngineManager:
    """
    Orchestrates AI Provider instantiation based on GlobalSettings,
    handles health checks, and acts as the entry point for AI tasks.
    """
    
    @staticmethod
    def get_active_provider(db: Session, **kwargs):
        settings = db.query(GlobalSettings).first()
        if not settings and not kwargs:
            raise ValueError("Settings not found.")
            
        provider_name = kwargs.get("provider") or (settings.ai_provider if settings else "gemini")
        provider_class = AIProviderRegistry.get_provider_class(provider_name)
        
        # Only inherit settings (like base_url and model) if testing the saved provider
        inherit_settings = settings and (not kwargs.get("provider") or kwargs.get("provider") == settings.ai_provider)
        
        api_key = kwargs.get("api_key") or (settings.ai_api_key if inherit_settings else None)
        if api_key and api_key.startswith("********") and inherit_settings:
            api_key = settings.ai_api_key # Use real key if they pass masked key

        return provider_class(
            api_key=api_key,
            base_url=kwargs.get("base_url") or (settings.ai_base_url if inherit_settings else None),
            model=kwargs.get("model") or (settings.ai_model if inherit_settings else None),
            temperature=settings.ai_temperature if settings else "0.7",
            max_tokens=settings.ai_max_tokens if settings else 2048
        )

    @staticmethod
    async def generate(db: Session, task: str, prompt: str, context: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        provider = AIEngineManager.get_active_provider(db, **kwargs)
        
        # Enforce capability check
        task_lower = task.lower()
        required_capability = "metadata" if "metadata" in task_lower else ("seo" if "seo" in task_lower else "text_generation")
        if required_capability not in provider.capabilities and "text_generation" not in provider.capabilities:
            # We assume 'metadata' and 'seo' are the specific tasks.
            # If not found, and no generic text_generation exists, warn.
            if "metadata" not in provider.capabilities and "seo" not in provider.capabilities:
                 raise ValueError(f"Provider '{provider.__class__.__name__}' does not support task capability: {task}")
                 
        return await provider.generate(task, prompt, context)

    @staticmethod
    async def test_connection(db: Session, **kwargs) -> Dict[str, Any]:
        provider = AIEngineManager.get_active_provider(db, **kwargs)
        return await provider.test_connection()

    @staticmethod
    async def get_models(db: Session, **kwargs) -> List[str]:
        provider = AIEngineManager.get_active_provider(db, **kwargs)
        
        # Check cache
        cached = ModelCache.get(
            provider.__class__.__name__, 
            provider.api_key, 
            provider.base_url
        )
        if cached is not None:
            return cached
            
        # Fetch from API
        models = await provider.get_models()
        if models:
            ModelCache.set(
                provider.__class__.__name__, 
                provider.api_key, 
                provider.base_url, 
                models
            )
        return models

    @staticmethod
    def get_capabilities(db: Session, **kwargs) -> List[str]:
        provider = AIEngineManager.get_active_provider(db, **kwargs)
        return provider.capabilities

    @staticmethod
    async def health_check(db: Session) -> bool:
        """
        Non-blocking health check designed to run at startup.
        Logs the result without crashing.
        """
        try:
            settings = db.query(GlobalSettings).first()
            if not settings or not settings.ai_enabled:
                logger.info("AIEngine Health Check: Skipped (AI Disabled)")
                return True
                
            provider = AIEngineManager.get_active_provider(db)
            result = await provider.test_connection()
            if result.get("success"):
                logger.info(f"AIEngine Health Check: OK ({result['provider']})")
                return True
            else:
                logger.warning(f"AIEngine Health Check: FAILED ({result['provider']}) - {result.get('error')}")
                return False
        except Exception as e:
            logger.error(f"AIEngine Health Check: ERROR - {str(e)}")
            return False
