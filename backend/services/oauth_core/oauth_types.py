from dataclasses import dataclass
from typing import Optional, List
from enum import Enum

class OAuthHealthStatus(Enum):
    READY = "READY"
    NOT_CONNECTED = "NOT_CONNECTED"
    TOKEN_EXPIRED = "TOKEN_EXPIRED"
    REFRESH_REQUIRED = "REFRESH_REQUIRED"
    REFRESH_FAILED = "REFRESH_FAILED"
    GOOGLE_UNREACHABLE = "GOOGLE_UNREACHABLE"
    INVALID_CONFIGURATION = "INVALID_CONFIGURATION"
    UNKNOWN = "UNKNOWN"

@dataclass
class OAuthConfiguration:
    client_id: str
    project_id: str
    client_secret: str
    auth_uri: str
    token_uri: str
    redirect_uris: List[str]
    scopes: List[str]

@dataclass
class OAuthToken:
    access_token: str
    refresh_token: Optional[str]
    expires_at: Optional[str]

@dataclass
class OAuthHealthReport:
    status: OAuthHealthStatus
    details: str

@dataclass
class OAuthValidationResult:
    is_valid: bool
    errors: List[str]

@dataclass
class AuthorizationResult:
    auth_url: str
    state: str
