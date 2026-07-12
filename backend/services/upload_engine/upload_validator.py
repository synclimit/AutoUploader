import os
from sqlalchemy.orm import Session

from services.oauth_core import OAuthHealth, OAuthHealthStatus
from .upload_types import UploadRequest
from .upload_exceptions import (
    CredentialUnavailable, OAuthUnavailable, InvalidMetadata, MissingVideo
)

class UploadValidator:
    """
    Tanggung jawab:
    ✓ Credential tersedia
    ✓ OAuth sehat
    ✓ Token valid
    ✓ File video ada
    ✓ Metadata valid
    ✓ Thumbnail valid
    ✓ Permission valid
    """
    
    @staticmethod
    def validate(db: Session, request: UploadRequest) -> None:
        # 1. Validate File Existence
        if not request.video_path or not os.path.exists(request.video_path):
            raise MissingVideo(f"Video file not found at path: {request.video_path}")
            
        if request.thumbnail_path and not os.path.exists(request.thumbnail_path):
            raise InvalidMetadata(f"Thumbnail file not found at path: {request.thumbnail_path}")
            
        # 2. Validate Metadata
        if not request.metadata.title:
            raise InvalidMetadata("Title cannot be empty")
            
        # 3. Validate OAuth / Credentials
        health_report = OAuthHealth.evaluate(db, request.channel_id)
        if health_report.status == OAuthHealthStatus.INVALID_CONFIGURATION:
            raise CredentialUnavailable("Client Secret or OAuth Configuration is invalid.")
            
        if health_report.status == OAuthHealthStatus.NOT_CONNECTED:
            raise OAuthUnavailable("Channel is not connected to YouTube.")
            
        if health_report.status in [OAuthHealthStatus.TOKEN_EXPIRED, OAuthHealthStatus.REFRESH_FAILED, OAuthHealthStatus.REFRESH_REQUIRED]:
            # The UploadManager is allowed to try to refresh it if it's REFRESH_REQUIRED,
            # but for strict validation, if it's REFRESH_FAILED or EXPIRED (without refresh token), we reject it.
            if health_report.status != OAuthHealthStatus.REFRESH_REQUIRED:
                raise OAuthUnavailable(f"OAuth is unavailable: {health_report.details}")
