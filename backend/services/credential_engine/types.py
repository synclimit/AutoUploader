from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from enum import Enum

class HealthStatus(Enum):
    CONNECTED = "CONNECTED"
    JSON_INVALID = "JSON_INVALID"
    JSON_MISSING = "JSON_MISSING"
    PROJECT_DUPLICATE = "PROJECT_DUPLICATE"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    REFRESH_FAILED = "REFRESH_FAILED"
    OAUTH_FAILED = "OAUTH_FAILED"
    QUOTA_EXHAUSTED = "QUOTA_EXHAUSTED"
    NEEDS_RECONNECT = "NEEDS_RECONNECT"
    UNKNOWN = "UNKNOWN"

@dataclass
class ValidationResult:
    is_valid: bool
    error_message: Optional[str] = None
    
@dataclass
class CredentialInfo:
    client_id: str
    project_id: str
    client_secret: str
    auth_uri: str
    token_uri: str
    redirect_uris: List[str]
    raw_json: Dict[str, Any]

@dataclass
class OAuthToken:
    access_token: str
    refresh_token: str
    expires_at: str  # ISO Format string or datetime
    
@dataclass
class HealthReport:
    status: HealthStatus
    details: str
    
@dataclass
class DiagnosticReport:
    json_exists: bool
    json_valid: bool
    project_id_read: bool
    oauth_config_valid: bool
    token_exists: bool
    refresh_token_exists: bool
    folder_exists: bool
    has_permission: bool
    workspace_valid: bool
    upload_ready: bool
    overall_health: HealthStatus
    details: List[str]
