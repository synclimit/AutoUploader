from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime
from typing import Optional
from models import OAuthCredential, Channel

from .oauth_types import OAuthToken, OAuthHealthStatus
from .oauth_exceptions import OAuthConnectionException

class OAuthRepository:
    """
    Tanggung jawab:
    Semua akses database OAuth dilakukan melalui Repository.
    - Load Token
    - Save Token
    - Update Token
    - Delete Token
    - Get By Channel
    - Update Health
    """
    
    @staticmethod
    def save_or_update_token(db: Session, channel_id: str, token: OAuthToken) -> None:
        try:
            cred = db.query(OAuthCredential).filter_by(channel_id=channel_id).first()
            expires_dt = datetime.fromisoformat(token.expires_at) if token.expires_at else None
            
            if cred:
                cred.access_token = token.access_token
                cred.refresh_token = token.refresh_token or cred.refresh_token
                cred.token_expires_at = expires_dt
                cred.refresh_failed_count = 0
                cred.last_refresh_at = datetime.utcnow()
                cred.last_refresh_error = None
            else:
                cred = OAuthCredential(
                    channel_id=channel_id,
                    access_token=token.access_token,
                    refresh_token=token.refresh_token,
                    token_expires_at=expires_dt
                )
                db.add(cred)
                
            db.commit()
        except Exception as e:
            db.rollback()
            raise OAuthConnectionException(f"Database error while saving token: {e}")

    @staticmethod
    def load_token(db: Session, channel_id: str) -> Optional[OAuthToken]:
        cred = db.query(OAuthCredential).filter_by(channel_id=channel_id).first()
        if not cred:
            return None
            
        return OAuthToken(
            access_token=cred.access_token,
            refresh_token=cred.refresh_token,
            expires_at=cred.token_expires_at.isoformat() if cred.token_expires_at else None
        )

    @staticmethod
    def delete_token(db: Session, channel_id: str) -> None:
        try:
            db.query(OAuthCredential).filter_by(channel_id=channel_id).delete()
            db.commit()
        except Exception as e:
            db.rollback()
            raise OAuthConnectionException(f"Database error while deleting token: {e}")
            
    @staticmethod
    def update_health(db: Session, channel_id: str, status: OAuthHealthStatus) -> None:
        try:
            channel = db.query(Channel).filter_by(id=channel_id).first()
            if channel:
                channel.health_status = status.value
                db.commit()
        except Exception as e:
            db.rollback()
            raise OAuthConnectionException(f"Database error while updating health: {e}")
            
    @staticmethod
    def increment_refresh_failure(db: Session, channel_id: str, error_msg: str) -> int:
        try:
            cred = db.query(OAuthCredential).filter_by(channel_id=channel_id).first()
            if cred:
                cred.refresh_failed_count += 1
                cred.last_refresh_error = error_msg
                cred.last_refresh_at = datetime.utcnow()
                db.commit()
                return cred.refresh_failed_count
            return 0
        except Exception as e:
            db.rollback()
            raise OAuthConnectionException(f"Database error while incrementing refresh failure: {e}")
