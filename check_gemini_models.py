import asyncio
from database.db import SessionLocal
from models import Settings
from services.ai_engine.providers.gemini import GeminiProvider

async def main():
    db = SessionLocal()
    # Fetch AI settings from DB
    settings_obj = db.query(Settings).filter(Settings.key == "ai_provider").first()
    if not settings_obj:
        print("No AI provider settings found.")
        return
        
    ai_settings = settings_obj.value if isinstance(settings_obj.value, dict) else eval(settings_obj.value)
    api_key = ai_settings.get("api_key")
    if not api_key:
        print("No API key found in DB.")
        return
        
    provider = GeminiProvider(api_key=api_key)
    models = await provider.get_models()
    print("Available Gemini Models:", models)

if __name__ == "__main__":
    asyncio.run(main())
