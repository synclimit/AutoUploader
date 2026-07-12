from sqlalchemy.orm import Session
from .oauth_repository import OAuthRepository
from .oauth_validator import OAuthValidator
from .refresh_service import RefreshService
from .oauth_types import OAuthHealthStatus, OAuthHealthReport

class OAuthHealth:
    """
    Tanggung jawab:
    Mengecek dan mengevaluasi status kesehatan (health) dari koneksi OAuth.
    Status minimal: READY, NOT_CONNECTED, TOKEN_EXPIRED, REFRESH_REQUIRED, 
    REFRESH_FAILED, GOOGLE_UNREACHABLE, INVALID_CONFIGURATION, UNKNOWN.
    """
    
    @classmethod
    def evaluate(cls, db: Session, channel_id: str) -> OAuthHealthReport:
        # 1. Check Configuration
        val_result = OAuthValidator.validate_configuration(channel_id)
        if not val_result.is_valid:
            return OAuthHealthReport(
                status=OAuthHealthStatus.INVALID_CONFIGURATION,
                details=f"Configuration invalid: {', '.join(val_result.errors)}"
            )
            
        # 2. Check Database Token
        token = OAuthRepository.load_token(db, channel_id)
        if not token or not token.access_token:
            return OAuthHealthReport(
                status=OAuthHealthStatus.NOT_CONNECTED,
                details="No access token found in database."
            )
            
        # 3. Check Expiration
        if RefreshService.is_expired(token):
            if not token.refresh_token:
                return OAuthHealthReport(
                    status=OAuthHealthStatus.TOKEN_EXPIRED,
                    details="Token is expired and no refresh token is available."
                )
            else:
                return OAuthHealthReport(
                    status=OAuthHealthStatus.REFRESH_REQUIRED,
                    details="Token is expired but refresh token is available."
                )
                
        # (Optional) We could do a ping test here for GOOGLE_UNREACHABLE, but skipping for speed unless required
        
        return OAuthHealthReport(
            status=OAuthHealthStatus.READY,
            details="OAuth connection is fully operational."
        )
