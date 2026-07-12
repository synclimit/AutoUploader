import logging
from sqlalchemy.orm import Session
from datetime import datetime

from services.oauth_core import OAuthRepository, OAuthHealthStatus, RefreshService, OAuthConnectionException
from .upload_types import UploadRequest
from .upload_progress import UploadProgress
from .upload_state_machine import UploadState
from .upload_result import UploadResult
from .upload_validator import UploadValidator
from .upload_session import UploadSession
from .upload_repository import UploadRepository
from .upload_exceptions import (
    UploadFailed, QuotaExceeded, CredentialUnavailable, OAuthUnavailable, 
    InvalidMetadata, MissingVideo, UploadCancelled, NetworkFailure
)

logger = logging.getLogger("UploadManager")

class UploadManager:
    """
    Tanggung jawab:
    - memulai upload
    - meminta credential ke Credential Engine & token ke OAuth Core (lewat Validator/Repository)
    - menjalankan upload
    - melaporkan progress (ke UploadRepository / caller)
    - mengembalikan UploadResult
    """
    
    @classmethod
    def execute_upload(cls, db: Session, request: UploadRequest) -> UploadResult:
        logger.info(f"Starting upload for task: {request.task_id} on channel: {request.channel_id}")
        started_at = datetime.utcnow()
        UploadRepository.update_task_state(db, request.task_id, UploadState.VALIDATING)
        
        try:
            # 1. Validation
            UploadValidator.validate(db, request)
            
            # 2. Get Token (refresh if needed)
            token = OAuthRepository.load_token(db, request.channel_id)
            if not token:
                raise OAuthUnavailable("Token missing after validation.")
                
            if RefreshService.is_expired(token):
                logger.info(f"Token expired for channel {request.channel_id}, attempting refresh...")
                token = RefreshService.refresh(request.channel_id, token)
                OAuthRepository.save_or_update_token(db, request.channel_id, token)
                logger.info("Token refreshed successfully prior to upload.")

            # 3. Execution
            UploadRepository.update_task_state(db, request.task_id, UploadState.PREPARING)
            session = UploadSession(request.channel_id, token, request)
            
            # 4. Handle progress yields
            result = None
            generator = session.execute()
            
            for item in generator:
                if isinstance(item, UploadProgress):
                    UploadRepository.log_progress(db, request.task_id, item)
                elif isinstance(item, UploadResult):
                    result = item
            
            if not result:
                raise UploadFailed("Upload session completed without returning a result.")
                
            UploadRepository.save_result(db, request.task_id, result)
            return result

        except Exception as e:
            # Map exception to appropriate failure state and result
            error_code = e.__class__.__name__
            error_message = str(e)
            logger.error(f"Upload failed for {request.task_id}: {error_message}")
            
            result = UploadResult(
                success=False,
                video_id=None,
                error_code=error_code,
                error_message=error_message,
                started_at=started_at,
                finished_at=datetime.utcnow(),
                elapsed_time_seconds=(datetime.utcnow() - started_at).total_seconds()
            )
            
            if isinstance(e, QuotaExceeded):
                UploadRepository.update_task_state(db, request.task_id, UploadState.QUOTA_WAIT)
            else:
                UploadRepository.update_task_state(db, request.task_id, UploadState.FAILED)
                
            UploadRepository.save_result(db, request.task_id, result)
            
            # We also might want to re-raise if caller wants to handle it, 
            # but usually manager returning a failed Result is enough for the State Machine.
            return result
