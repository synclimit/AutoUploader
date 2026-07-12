from datetime import datetime, timezone
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from .storage_manager import StorageManager
from .types import OAuthToken
from .exceptions import RefreshFailedException, MissingJsonException
from sqlalchemy.orm import Session
from sqlalchemy import text

class TokenManager:
    """
    Tanggung jawab:
    - cek expired
    - refresh token
    - simpan token
    - update token
    - revoke token (via API)
    - reset refresh counter
    - increment refresh counter
    """
    
    @staticmethod
    def is_expired(expires_at_str: str) -> bool:
        if not expires_at_str:
            return True
        try:
            expires_at = datetime.fromisoformat(expires_at_str)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            # Add a 5 minute buffer
            return datetime.now(timezone.utc) >= expires_at
        except ValueError:
            return True

    @classmethod
    def refresh_token(cls, channel_id: str, client_id: str, refresh_token: str) -> OAuthToken:
        if not StorageManager.exists(channel_id):
            raise MissingJsonException(f"Missing credential file for {channel_id}")
            
        secret_json = StorageManager.load_json(channel_id)
        auth_data = secret_json.get("installed") or secret_json.get("web")
        client_secret = auth_data["client_secret"]
        token_uri = auth_data["token_uri"]
        
        creds = Credentials(
            token=None,
            refresh_token=refresh_token,
            token_uri=token_uri,
            client_id=client_id,
            client_secret=client_secret
        )
        
        try:
            creds.refresh(Request())
            return OAuthToken(
                access_token=creds.token,
                refresh_token=creds.refresh_token or refresh_token,
                expires_at=creds.expiry.isoformat() if creds.expiry else None
            )
        except Exception as e:
            raise RefreshFailedException(f"Failed to refresh token: {e}")
            
    @classmethod
    def increment_refresh_counter(cls, db: Session, channel_id: str) -> int:
        # DB logic placeholder (executed via raw SQL to decouple from Phase 3 models)
        query = "UPDATE channels SET refresh_failed_count = COALESCE(refresh_failed_count, 0) + 1 WHERE id = :id RETURNING refresh_failed_count"
        result = db.execute(text(query), {"id": channel_id}).scalar()
        db.commit()
        return result or 0
        
    @classmethod
    def reset_refresh_counter(cls, db: Session, channel_id: str) -> None:
        query = "UPDATE channels SET refresh_failed_count = 0 WHERE id = :id"
        db.execute(text(query), {"id": channel_id})
        db.commit()
