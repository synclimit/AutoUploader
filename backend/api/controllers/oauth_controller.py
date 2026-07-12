import logging
import time
from typing import Dict, Any, Union
from fastapi import Request
from sqlalchemy.orm import Session

from services.oauth_core import (
    OAuthFlow, TokenExchange, RefreshService, OAuthHealth, OAuthValidator,
    OAuthConfigurationException, OAuthConnectionException, TokenExchangeException,
    RefreshTokenException, InvalidScopeException, GoogleUnavailableException,
    UnauthorizedException, OAuthRepository
)
from services.credential_engine import DiagnosticsManager, StorageManager, JsonValidator
from api.schemas.oauth_schema import SuccessResponse, ErrorResponse

logger = logging.getLogger("OAuthController")

class OAuthController:
    
    @staticmethod
    def _map_error(e: Exception) -> ErrorResponse:
        if isinstance(e, OAuthConfigurationException):
            return ErrorResponse(success=False, error_code="OA001", message="Configuration Error", detail={"reason": str(e)})
        elif isinstance(e, TokenExchangeException):
            return ErrorResponse(success=False, error_code="OA002", message="Token Exchange Error", detail={"reason": str(e)})
        elif isinstance(e, RefreshTokenException):
            return ErrorResponse(success=False, error_code="OA003", message="Refresh Token Error", detail={"reason": str(e)})
        elif isinstance(e, InvalidScopeException):
            return ErrorResponse(success=False, error_code="OA004", message="Invalid Scope Error", detail={"reason": str(e)})
        elif isinstance(e, GoogleUnavailableException):
            return ErrorResponse(success=False, error_code="OA005", message="Google API Unavailable", detail={"reason": str(e)})
        elif isinstance(e, UnauthorizedException):
            return ErrorResponse(success=False, error_code="OA006", message="Unauthorized", detail={"reason": str(e)})
        elif isinstance(e, OAuthConnectionException):
            return ErrorResponse(success=False, error_code="OA007", message="Connection Error", detail={"reason": str(e)})
        else:
            return ErrorResponse(success=False, error_code="OA500", message="Internal Server Error", detail={"reason": str(e)})

    @staticmethod
    def get_oauth_url(channel_id: str, redirect_uri: str) -> Union[SuccessResponse, ErrorResponse]:
        start_time = time.time()
        logger.info(f"Generating OAuth URL for channel: {channel_id}")
        try:
            result = OAuthFlow.generate_authorization_url(channel_id, redirect_uri)
            
            # Since OAuthFlow uses google-auth-oauthlib, it generates a 'state'
            # We typically want to stash 'channel_id' into the state or a cache 
            # so the callback knows which channel is authenticating.
            # Here we can just append channel_id to state or rely on frontend to pass it
            
            exec_time = time.time() - start_time
            logger.info(f"[EXEC: {exec_time:.3f}s] Successfully generated OAuth URL for channel: {channel_id}")
            
            return SuccessResponse(
                success=True, 
                message="OAuth URL generated successfully", 
                data={"auth_url": result.auth_url, "state": result.state}
            )
        except Exception as e:
            exec_time = time.time() - start_time
            logger.error(f"[EXEC: {exec_time:.3f}s] Error generating OAuth URL for {channel_id}: {e}")
            return OAuthController._map_error(e)

    @staticmethod
    def handle_callback(db: Session, channel_id: str, code: str, redirect_uri: str) -> Union[SuccessResponse, ErrorResponse]:
        start_time = time.time()
        logger.info(f"Handling OAuth callback for channel: {channel_id}")
        try:
            token = TokenExchange.exchange_code(channel_id, code, redirect_uri)
            OAuthRepository.save_or_update_token(db, channel_id, token)
            
            exec_time = time.time() - start_time
            logger.info(f"[EXEC: {exec_time:.3f}s] Successfully handled callback and saved token for channel: {channel_id}")
            return SuccessResponse(success=True, message="OAuth connected successfully", data={})
        except Exception as e:
            exec_time = time.time() - start_time
            logger.error(f"[EXEC: {exec_time:.3f}s] Error in callback for {channel_id}: {e}")
            return OAuthController._map_error(e)

    @staticmethod
    def refresh_token(db: Session, channel_id: str) -> Union[SuccessResponse, ErrorResponse]:
        start_time = time.time()
        logger.info(f"Refreshing token for channel: {channel_id}")
        try:
            current_token = OAuthRepository.load_token(db, channel_id)
            if not current_token:
                raise OAuthConnectionException("No token found for channel to refresh.")
                
            new_token = RefreshService.refresh(channel_id, current_token)
            OAuthRepository.save_or_update_token(db, channel_id, new_token)
            
            exec_time = time.time() - start_time
            logger.info(f"[EXEC: {exec_time:.3f}s] Successfully refreshed token for channel: {channel_id}")
            return SuccessResponse(success=True, message="Token refreshed successfully", data={})
        except Exception as e:
            exec_time = time.time() - start_time
            OAuthRepository.increment_refresh_failure(db, channel_id, str(e))
            logger.error(f"[EXEC: {exec_time:.3f}s] Error refreshing token for {channel_id}: {e}")
            return OAuthController._map_error(e)

    @staticmethod
    def get_health(db: Session, channel_id: str) -> Union[SuccessResponse, ErrorResponse]:
        start_time = time.time()
        logger.info(f"Checking health for channel: {channel_id}")
        try:
            report = OAuthHealth.evaluate(db, channel_id)
            # update health in DB
            OAuthRepository.update_health(db, channel_id, report.status)
            
            exec_time = time.time() - start_time
            logger.info(f"[EXEC: {exec_time:.3f}s] Health check completed for {channel_id}")
            return SuccessResponse(
                success=True, 
                message="Health check completed", 
                data={"status": report.status.value, "details": report.details}
            )
        except Exception as e:
            exec_time = time.time() - start_time
            logger.error(f"[EXEC: {exec_time:.3f}s] Error checking health for {channel_id}: {e}")
            return OAuthController._map_error(e)

    @staticmethod
    def get_diagnostics(channel_id: str) -> Union[SuccessResponse, ErrorResponse]:
        start_time = time.time()
        logger.info(f"Running diagnostics for channel: {channel_id}")
        try:
            # We use Phase 2 DiagnosticsManager for comprehensive diagnostics
            report = DiagnosticsManager.run_diagnostics(channel_id)
            
            exec_time = time.time() - start_time
            logger.info(f"[EXEC: {exec_time:.3f}s] Diagnostics completed for {channel_id}")
            return SuccessResponse(
                success=True, 
                message="Diagnostics completed", 
                data={
                    "is_healthy": report.is_healthy,
                    "issues": report.issues
                }
            )
        except Exception as e:
            exec_time = time.time() - start_time
            logger.error(f"[EXEC: {exec_time:.3f}s] Error running diagnostics for {channel_id}: {e}")
            return OAuthController._map_error(e)
            
    @staticmethod
    def upload_credential(channel_id: str, file_content: str) -> Union[SuccessResponse, ErrorResponse]:
        start_time = time.time()
        logger.info(f"Uploading credential for channel: {channel_id}")
        try:
            import json
            
            # Validate JSON
            parsed = JsonValidator.validate_and_parse(file_content)
            
            # Save raw dict
            raw_dict = json.loads(file_content)
            StorageManager.save_json(channel_id, raw_dict)
            
            exec_time = time.time() - start_time
            logger.info(f"[EXEC: {exec_time:.3f}s] Credential uploaded successfully for {channel_id}")
            return SuccessResponse(success=True, message="Credential uploaded successfully", data={})
        except Exception as e:
            exec_time = time.time() - start_time
            logger.error(f"[EXEC: {exec_time:.3f}s] Error uploading credential for {channel_id}: {e}")
            return OAuthController._map_error(e)
