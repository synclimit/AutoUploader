from pydantic import BaseModel
from typing import Any, Optional, Dict

class BaseResponse(BaseModel):
    success: bool
    message: str

class SuccessResponse(BaseResponse):
    data: Optional[Dict[str, Any]] = None

class ErrorResponse(BaseResponse):
    error_code: str
    detail: Optional[Dict[str, Any]] = None

class OAuthUrlResponseData(BaseModel):
    auth_url: str
    state: str

class OAuthHealthData(BaseModel):
    status: str
    details: str

class OAuthDiagnosticsData(BaseModel):
    is_healthy: bool
    project_valid: bool
    quota_ok: bool
    details: str
