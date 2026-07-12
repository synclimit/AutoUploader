from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import text
from .storage_manager import StorageManager
from .types import DiagnosticReport, HealthStatus
from .json_validator import JsonValidator
from services.workspace_manager import WorkspaceManager
import os

class DiagnosticsManager:
    """
    Tanggung jawab:
    Implementasi Diagnostics Run.
    Minimal pemeriksaan:
    - JSON ada
    - JSON valid
    - Project ID (valid/duplicate)
    - OAuth Config
    - Token
    - Refresh Token
    - Folder
    - Permission
    - Workspace
    - Upload Ready
    """
    
    @classmethod
    def run_diagnostics(cls, db: Session, channel_id: str) -> DiagnosticReport:
        details: List[str] = []
        
        # 1. Workspace
        workspace_valid = WorkspaceManager.validate()
        if not workspace_valid:
            details.append("Workspace folders are missing or invalid.")
            
        # 2. Folder
        channel_dir = WorkspaceManager.get_channel_credential_dir(channel_id)
        folder_exists = channel_dir.exists()
        has_permission = os.access(channel_dir, os.R_OK | os.W_OK) if folder_exists else False
        if not folder_exists:
            details.append(f"Channel credential folder missing: {channel_dir}")
        elif not has_permission:
            details.append("Channel credential folder lacks read/write permissions.")
            
        # 3. JSON
        json_exists = StorageManager.exists(channel_id)
        json_valid = False
        project_id_read = False
        oauth_config_valid = False
        
        if not json_exists:
            details.append("client_secret.json is missing.")
        else:
            try:
                # We can load it and validate
                with open(StorageManager._get_secret_file(channel_id), "r", encoding="utf-8") as f:
                    content = f.read()
                cred_info = JsonValidator.validate_and_parse(content)
                json_valid = True
                project_id_read = bool(cred_info.project_id)
                oauth_config_valid = True
            except Exception as e:
                details.append(f"JSON validation failed: {e}")
                
        # 4. DB Tokens (using raw SQL for Phase 2)
        query = "SELECT access_token, refresh_token, project_id FROM channels WHERE id = :id"
        result = db.execute(text(query), {"id": channel_id}).fetchone()
        
        token_exists = False
        refresh_token_exists = False
        db_project_id = None
        
        if result:
            token_exists = bool(result[0])
            refresh_token_exists = bool(result[1])
            db_project_id = result[2]
            
            if not token_exists:
                details.append("Access token is missing from database.")
            if not refresh_token_exists:
                details.append("Refresh token is missing from database.")
        else:
            details.append("Channel ID not found in database.")
            
        # Project ID Match
        if project_id_read and db_project_id and cred_info.project_id != db_project_id:
            details.append("Project ID in JSON does not match database record.")
            oauth_config_valid = False
            
        upload_ready = (
            workspace_valid and folder_exists and has_permission and
            json_exists and json_valid and project_id_read and oauth_config_valid and
            token_exists and refresh_token_exists
        )
        
        if upload_ready:
            overall_health = HealthStatus.CONNECTED
        elif not json_exists:
            overall_health = HealthStatus.JSON_MISSING
        elif not json_valid:
            overall_health = HealthStatus.JSON_INVALID
        elif not token_exists or not refresh_token_exists:
            overall_health = HealthStatus.NEEDS_RECONNECT
        else:
            overall_health = HealthStatus.UNKNOWN
            
        return DiagnosticReport(
            json_exists=json_exists,
            json_valid=json_valid,
            project_id_read=project_id_read,
            oauth_config_valid=oauth_config_valid,
            token_exists=token_exists,
            refresh_token_exists=refresh_token_exists,
            folder_exists=folder_exists,
            has_permission=has_permission,
            workspace_valid=workspace_valid,
            upload_ready=upload_ready,
            overall_health=overall_health,
            details=details
        )
