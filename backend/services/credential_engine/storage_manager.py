import json
import shutil
from pathlib import Path
from typing import Dict, Any, Optional
from services.workspace_manager import WorkspaceManager
from .exceptions import WorkspaceException, MissingJsonException

class StorageManager:
    """
    Tanggung jawab:
    - simpan JSON
    - baca JSON
    - hapus JSON
    - update JSON
    - cek keberadaan JSON
    - backup JSON
    - restore JSON
    
    Tidak ada hardcoded path, menggunakan WorkspaceManager.
    """
    
    @staticmethod
    def _get_secret_file(channel_id: str) -> Path:
        cred_dir = WorkspaceManager.get_channel_credential_dir(channel_id)
        if not cred_dir.exists():
            return cred_dir / "client_secret.json"
            
        json_files = list(cred_dir.glob("*.json"))
        valid_files = [f for f in json_files if not f.name.endswith(".backup.json")]
        
        if valid_files:
            for f in valid_files:
                if f.name == "client_secret.json":
                    return f
            return valid_files[0]
            
        return cred_dir / "client_secret.json"
        
    @staticmethod
    def _get_backup_file(channel_id: str) -> Path:
        return WorkspaceManager.get_channel_credential_dir(channel_id) / "client_secret.backup.json"
        
    @classmethod
    def save_json(cls, channel_id: str, data: Dict[str, Any]) -> None:
        file_path = cls._get_secret_file(channel_id)
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            raise WorkspaceException(f"Failed to save credential JSON: {e}")
            
    @classmethod
    def load_json(cls, channel_id: str) -> Dict[str, Any]:
        file_path = cls._get_secret_file(channel_id)
        if not file_path.exists():
            raise MissingJsonException(f"Credential file not found for channel {channel_id}")
            
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except json.JSONDecodeError as e:
            raise WorkspaceException(f"Corrupted credential JSON: {e}")
        except Exception as e:
            raise WorkspaceException(f"Failed to read credential JSON: {e}")
            
    @classmethod
    def delete_json(cls, channel_id: str) -> None:
        file_path = cls._get_secret_file(channel_id)
        if file_path.exists():
            try:
                file_path.unlink()
            except Exception as e:
                raise WorkspaceException(f"Failed to delete credential JSON: {e}")
                
    @classmethod
    def exists(cls, channel_id: str) -> bool:
        return cls._get_secret_file(channel_id).exists()
        
    @classmethod
    def backup_json(cls, channel_id: str) -> None:
        file_path = cls._get_secret_file(channel_id)
        backup_path = cls._get_backup_file(channel_id)
        
        if not file_path.exists():
            raise MissingJsonException("Cannot backup missing credential JSON.")
            
        try:
            shutil.copy2(file_path, backup_path)
        except Exception as e:
            raise WorkspaceException(f"Failed to backup credential JSON: {e}")
            
    @classmethod
    def restore_json(cls, channel_id: str) -> None:
        file_path = cls._get_secret_file(channel_id)
        backup_path = cls._get_backup_file(channel_id)
        
        if not backup_path.exists():
            raise WorkspaceException("No backup available to restore.")
            
        try:
            shutil.copy2(backup_path, file_path)
        except Exception as e:
            raise WorkspaceException(f"Failed to restore credential JSON: {e}")
