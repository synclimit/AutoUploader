import os
import shutil
from pathlib import Path
from services.system.path_service import PathService

class WorkspaceManager:
    """
    Phase 1: Workspace Engine
    Responsible for initializing, validating, and recovering workspace folders.
    """
    
    @staticmethod
    def get_root_dir() -> Path:
        # Utilizing PathService to avoid hardcoding APPDATA logic
        return Path(PathService.get_appdata_dir()) / "workspace"
        
    @staticmethod
    def get_credentials_dir() -> Path:
        return WorkspaceManager.get_root_dir() / "credentials"
        
    @staticmethod
    def get_channel_credential_dir(channel_uuid: str) -> Path:
        channel_dir = WorkspaceManager.get_credentials_dir() / channel_uuid
        channel_dir.mkdir(parents=True, exist_ok=True)
        return channel_dir
        
    @staticmethod
    def get_backup_dir() -> Path:
        return WorkspaceManager.get_root_dir() / "backup"
        
    @staticmethod
    def get_cache_dir() -> Path:
        return WorkspaceManager.get_root_dir() / "cache"
        
    @staticmethod
    def get_temp_dir() -> Path:
        return WorkspaceManager.get_root_dir() / "temp"
        
    @staticmethod
    def get_logs_dir() -> Path:
        return WorkspaceManager.get_root_dir() / "logs"

    @classmethod
    def initialize(cls) -> None:
        """Creates all required workspace folders."""
        folders = [
            cls.get_root_dir(),
            cls.get_credentials_dir(),
            cls.get_backup_dir(),
            cls.get_cache_dir(),
            cls.get_temp_dir(),
            cls.get_logs_dir()
        ]
        for folder in folders:
            folder.mkdir(parents=True, exist_ok=True)
            
    @classmethod
    def validate(cls) -> bool:
        """Validates that all essential folders exist and have write permissions."""
        folders = [
            cls.get_root_dir(),
            cls.get_credentials_dir(),
            cls.get_backup_dir(),
            cls.get_cache_dir(),
            cls.get_temp_dir(),
            cls.get_logs_dir()
        ]
        
        for folder in folders:
            if not folder.exists():
                return False
            if not os.access(folder, os.W_OK):
                return False
                
        return True
        
    @classmethod
    def recover(cls) -> None:
        """Recovers missing folders if validation fails."""
        if not cls.validate():
            cls.initialize()
