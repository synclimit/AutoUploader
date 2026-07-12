from datetime import datetime, timezone
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
    def refresh(cls, channel_id: str, current_token: OAuthToken) -> OAuthToken:
        if not current_token.refresh_token:
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
            
            return OAuthToken(
                access_token=creds.token,
                refresh_token=creds.refresh_token or current_token.refresh_token,
                expires_at=creds.expiry.isoformat() if creds.expiry else None
            )
        except Exception as e:
            raise RefreshTokenException(f"Failed to refresh token: {e}")
