from typing import Any, Dict
from sqlalchemy.orm import Session
from sqlalchemy import text
from .json_validator import JsonValidator
from .project_validator import ProjectValidator
from .storage_manager import StorageManager
from .oauth_manager import OAuthManager
from .health_manager import HealthManager
from .types import OAuthToken, HealthStatus

class ReconnectManager:
    """
    Tanggung jawab:
    Reconnect.
    Jangan menghapus channel.
    Jangan membuat channel baru.
    Reconnect hanya mengganti: credential, token, oauth, health.
    Channel tetap sama.
    """
    
    @classmethod
    def begin_reconnect(cls, db: Session, channel_id: str, json_content: str, redirect_uri: str) -> tuple[str, str]:
        """
        Langkah 1 Reconnect: Upload JSON baru, validasi, simpan sementara, return OAuth URL.
        """
        # 1. Validasi JSON
        cred_info = JsonValidator.validate_and_parse(json_content)
        
        # 2. Validasi Duplikasi Project ID (abaikan channel_id ini sendiri jika project sama)
        ProjectValidator.validate_unique(db, cred_info.project_id, exclude_channel_id=channel_id)
        
        # 3. Backup kredensial lama jika ada
        if StorageManager.exists(channel_id):
            StorageManager.backup_json(channel_id)
            
        # 4. Simpan kredensial baru
        StorageManager.save_json(channel_id, cred_info.raw_json)
        
        # 5. Generate Auth URL
        auth_url, state = OAuthManager.generate_auth_url(channel_id, redirect_uri)
        
        return auth_url, state

    @classmethod
    def complete_reconnect(cls, db: Session, channel_id: str, redirect_uri: str, code: str) -> None:
        """
        Langkah 2 Reconnect: Terima code dari callback, tukar token, update DB & Health.
        """
        # 1. Tukar Token
        token: OAuthToken = OAuthManager.exchange_code(channel_id, redirect_uri, code)
        
        # 2. Update DB (Raw SQL for Phase 2 decoupling)
        query = """
            UPDATE channels 
            SET access_token = :access_token, 
                refresh_token = :refresh_token, 
                token_expires_at = :expires_at,
                refresh_failed_count = 0,
                health_status = :health_status
            WHERE id = :id
        """
        params = {
            "access_token": token.access_token,
            "refresh_token": token.refresh_token,
            "expires_at": token.expires_at,
            "health_status": HealthStatus.CONNECTED.value,
            "id": channel_id
        }
        db.execute(text(query), params)
        db.commit()
