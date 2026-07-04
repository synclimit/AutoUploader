from sqlalchemy.orm import Session
from models import GlobalSettings
from schemas import GlobalSettingsUpdate

class SettingsService:
    @staticmethod
    def get_settings(db: Session) -> GlobalSettings:
        settings = db.query(GlobalSettings).first()
        if not settings:
            settings = GlobalSettings()
            db.add(settings)
            db.commit()
            db.refresh(settings)
        return settings

    @staticmethod
    def update_settings(db: Session, data: GlobalSettingsUpdate) -> GlobalSettings:
        settings = db.query(GlobalSettings).first()
        if not settings:
            settings = GlobalSettings()
            db.add(settings)
            db.commit()
            db.refresh(settings)

        update_data = data.model_dump(exclude_unset=True)
        
        # Prevent overwriting with masked API keys
        if "ai_api_key" in update_data and update_data["ai_api_key"]:
            if update_data["ai_api_key"].startswith("********"):
                del update_data["ai_api_key"]

        # Clear base_url and model if switching providers (to prevent Atomesus url leaking to Gemini)
        if "ai_provider" in update_data and update_data["ai_provider"] != settings.ai_provider:
            if "ai_base_url" not in update_data:
                update_data["ai_base_url"] = None
            if "ai_model" not in update_data:
                update_data["ai_model"] = None

        for key, value in update_data.items():
            setattr(settings, key, value)
            
        db.commit()
        db.refresh(settings)
        return settings
