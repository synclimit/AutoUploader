from datetime import datetime, timezone
from sqlalchemy.orm import Session
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request

from .oauth_client import OAuthClient
from .oauth_types import OAuthToken
from .oauth_exceptions import RefreshTokenException

class RefreshService:
    """
    Tanggung jawab:
    - cek expired
    - refresh token
    - return token baru
    - update expiry
    Tidak boleh mengetahui Queue. Tidak boleh mengetahui Upload.
    """
    
    @staticmethod
    def is_expired(token: OAuthToken) -> bool:
        if not token.expires_at:
            return True
        try:
            expires_at = datetime.fromisoformat(token.expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            # 5 minute buffer
            return datetime.now(timezone.utc) >= expires_at
        except ValueError:
            return True
            
    @classmethod
    def refresh(cls, db: Session, channel_id: str, current_token: OAuthToken = None) -> OAuthToken:
        import logging
        from sqlalchemy.orm import Session
        from services.oauth_core.oauth_repository import OAuthRepository
        
        logger = logging.getLogger("RefreshService")
        logger.info(f"Starting token refresh for channel {channel_id}")
        
        if not current_token:
            current_token = OAuthRepository.load_token(db, channel_id)
            if not current_token:
                logger.error(f"Cannot refresh token for {channel_id}: No token found in DB.")
                raise RefreshTokenException("No token available to perform refresh.")
                
        if not current_token.refresh_token:
            logger.error(f"Cannot refresh token for {channel_id}: No refresh token available.")
            raise RefreshTokenException("No refresh token available to perform refresh.")
            
        try:
            config = OAuthClient.load_configuration(channel_id)
            
            creds = Credentials(
                token=current_token.access_token,
                refresh_token=current_token.refresh_token,
                token_uri=config.token_uri,
                client_id=config.client_id,
                client_secret=config.client_secret
            )
            
            creds.refresh(Request())
            
            new_token = OAuthToken(
                access_token=creds.token,
                refresh_token=creds.refresh_token or current_token.refresh_token,
                expires_at=creds.expiry.isoformat() if creds.expiry else None
            )
            
            OAuthRepository.save_or_update_token(db, channel_id, new_token)
            logger.info(f"Successfully refreshed and saved token for channel {channel_id}")
            return new_token
        except Exception as e:
            logger.error(f"Failed to refresh token for {channel_id}: {e}")
            OAuthRepository.increment_refresh_failure(db, channel_id, str(e))
            raise RefreshTokenException(f"Failed to refresh token: {e}")
