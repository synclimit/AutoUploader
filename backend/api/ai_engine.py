from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from database.db import get_db
from schemas import APIResponse
from services.ai_engine.manager import AIEngineManager

router = APIRouter(prefix="/api/v1/ai", tags=["AI Engine"])

class AIGenerateRequest(BaseModel):
    task: str
    prompt: Optional[str] = None
    keyword: Optional[str] = None
    seo_mode: Optional[str] = None
    language: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class TestConnectionResponse(BaseModel):
    provider: str
    model: Optional[str]
    endpoint: str
    latency_ms: int
    authentication: str
    error: Optional[str]
    success: bool

@router.get("/health", response_model=APIResponse[bool])
async def ai_health_check(db: Session = Depends(get_db)):
    is_healthy = await AIEngineManager.health_check(db)
    return APIResponse(data=is_healthy, success=True)

class ProviderConfigOverride(BaseModel):
    provider: Optional[str] = None
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    model: Optional[str] = None

@router.post("/test-connection", response_model=APIResponse[TestConnectionResponse])
async def test_connection(config: Optional[ProviderConfigOverride] = None, db: Session = Depends(get_db)):
    kwargs = config.model_dump(exclude_none=True) if config else {}
    result = await AIEngineManager.test_connection(db, **kwargs)
    return APIResponse(data=result, success=result.get("success", False))

@router.post("/models", response_model=APIResponse[List[str]])
async def get_models(config: Optional[ProviderConfigOverride] = None, db: Session = Depends(get_db)):
    kwargs = config.model_dump(exclude_none=True) if config else {}
    try:
        models = await AIEngineManager.get_models(db, **kwargs)
        return APIResponse(data=models, success=True)
    except Exception as e:
        return APIResponse(success=False, error={"code": "MODELS_ERROR", "message": str(e)})

@router.post("/capabilities", response_model=APIResponse[List[str]])
async def get_capabilities(config: Optional[ProviderConfigOverride] = None, db: Session = Depends(get_db)):
    kwargs = config.model_dump(exclude_none=True) if config else {}
    try:
        caps = AIEngineManager.get_capabilities(db, **kwargs)
        return APIResponse(data=caps, success=True)
    except Exception as e:
        return APIResponse(success=False, error={"code": "CAPABILITIES_ERROR", "message": str(e)})

@router.post("/generate", response_model=APIResponse[Dict[str, Any]])
async def generate(request: AIGenerateRequest, db: Session = Depends(get_db)):
    try:
        prompt = request.prompt
        
        if request.keyword:
            seo_mode = request.seo_mode or "SEO Maximum"
            language = request.language or "Auto"
            
            prompt = f"""
Generate YouTube video metadata for the following keyword: "{request.keyword}".
Target Language: {language}.
SEO Strategy: {seo_mode}.

Instructions:
1. Analyze the keyword to understand the core topic and intent.
2. Create a high CTR (Click-Through Rate) title that is engaging and searchable.
3. Create a comprehensive YouTube SEO description that includes the keyword naturally. Avoid keyword stuffing.
4. Create a list of relevant tags (comma-separated string).
5. You MUST return ONLY a valid JSON object with EXACTLY these keys: "title", "description", "tags".
Do not include any other text, markdown formatting (like ```json), or explanations. Return the raw JSON ONLY.
"""

        if not prompt:
            raise ValueError("Either prompt or keyword must be provided")

        result = await AIEngineManager.generate(
            db=db,
            task=request.task,
            prompt=prompt,
            context=request.context
        )
        return APIResponse(data=result, success=True)
    except Exception as e:
        return APIResponse(success=False, error={"code": "GENERATE_ERROR", "message": str(e)})
