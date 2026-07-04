from fastapi import APIRouter
from services.upload_engine import get_engine

router = APIRouter(prefix="/api/v1/upload-engine", tags=["Upload Engine"])

@router.get("/health")
def get_health():
    engine = get_engine()
    return engine.get_health()
