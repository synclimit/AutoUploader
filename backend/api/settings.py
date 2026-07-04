from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.db import get_db
from schemas import GlobalSettingsUpdate, GlobalSettingsResponse
from services.settings_service import SettingsService

router = APIRouter(prefix="/api/v1/settings", tags=["Settings"])

@router.get("", response_model=GlobalSettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings = SettingsService.get_settings(db)
    response = GlobalSettingsResponse.model_validate(settings)
    if response.ai_api_key:
        if len(response.ai_api_key) > 4:
            response.ai_api_key = "********" * 2 + response.ai_api_key[-4:]
        else:
            response.ai_api_key = "********" * 2
    return response

@router.put("", response_model=GlobalSettingsResponse)
def update_settings(data: GlobalSettingsUpdate, db: Session = Depends(get_db)):
    settings = SettingsService.update_settings(db, data)
    response = GlobalSettingsResponse.model_validate(settings)
    if response.ai_api_key:
        if len(response.ai_api_key) > 4:
            response.ai_api_key = "********" * 2 + response.ai_api_key[-4:]
        else:
            response.ai_api_key = "********" * 2
    return response
