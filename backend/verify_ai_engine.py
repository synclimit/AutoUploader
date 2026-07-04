import asyncio
from database.db import SessionLocal
from models import GlobalSettings
from services.ai_engine.manager import AIEngineManager

async def test_ai_engine():
    db = SessionLocal()
    settings = db.query(GlobalSettings).first()
    if not settings:
        settings = GlobalSettings()
        db.add(settings)
        db.commit()

    print("--- 1. Testing Gemini ---")
    settings.ai_enabled = True
    settings.ai_provider = "gemini"
    settings.ai_api_key = "dummy_key"
    settings.ai_base_url = None
    settings.ai_model = "gemini-1.5-flash"
    db.commit()
    
    result = await AIEngineManager.test_connection(db)
    print("Gemini Test Connection Result:", result)

    print("\n--- 2. Testing OpenAI Compatible (Atomesus) ---")
    settings.ai_provider = "openai_compatible"
    settings.ai_api_key = "atms_sk_dummy"
    settings.ai_base_url = "https://api.atomesus.com/v1"
    settings.ai_model = "atomesus-1"
    settings.ai_temperature = "0.7"
    settings.ai_max_tokens = 2048
    db.commit()
    
    result = await AIEngineManager.test_connection(db)
    print("Atomesus Test Connection Result:", result)

    print("\n--- 3. Testing Get Models (Refresh vs Manual fallback) ---")
    models = await AIEngineManager.get_models(db)
    print("Atomesus Models:", models)
    if not models:
        print("Fallback to Manual Model Entry allowed since models list is empty.")
        
    print("\n--- 4. Verify Generation with Dummy Key ---")
    try:
        gen_result = await AIEngineManager.generate(
            db, 
            task="Metadata generation", 
            prompt="Create a title for a video about dogs", 
            context={}
        )
        print("Generation Result:", gen_result)
    except Exception as e:
        print("Generation Exception (Expected due to dummy key):", e)
        
    db.close()

if __name__ == "__main__":
    asyncio.run(test_ai_engine())
