import asyncio
from database.db import SessionLocal
from models import Channel
import json

async def main():
    # Use direct API call so we don't depend on gemini.py which might have bugs
    import httpx
    db = SessionLocal()
    # Read API Key from settings (but in AutoUploader it's stored where?)
    # Wait, the screenshot shows the API key in the AI Provider settings.
    # We can just fetch it from Channel or Settings.
    from models import Settings
    settings_obj = db.query(Settings).filter(Settings.key == "ai_provider").first()
    if not settings_obj:
        print("No AI provider settings found.")
        return
        
    ai_settings = settings_obj.value if isinstance(settings_obj.value, dict) else eval(settings_obj.value)
    api_key = ai_settings.get("api_key")
    if not api_key:
        print("No API key found in DB.")
        return
        
    print(f"API Key found: {api_key[:5]}...")
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        print("Status:", resp.status_code)
        print("Models:", resp.text)

if __name__ == "__main__":
    asyncio.run(main())
