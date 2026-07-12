from services.workspace_manager import WorkspaceManager
from pathlib import Path

def test_workspace():
    print("Initializing Workspace...")
    WorkspaceManager.initialize()
    
    print("Validating Workspace...")
    is_valid = WorkspaceManager.validate()
    print(f"Is Valid: {is_valid}")
    
    print("Folders Created:")
    print(f"Root: {WorkspaceManager.get_root_dir()}")
    print(f"Credentials: {WorkspaceManager.get_credentials_dir()}")
    print(f"Backup: {WorkspaceManager.get_backup_dir()}")
    print(f"Cache: {WorkspaceManager.get_cache_dir()}")
    print(f"Temp: {WorkspaceManager.get_temp_dir()}")
    print(f"Logs: {WorkspaceManager.get_logs_dir()}")
    
    # Test channel specific folder
    channel_dir = WorkspaceManager.get_channel_credential_dir("test-channel-uuid-1234")
    print(f"Channel Dir: {channel_dir}")
    print(f"Channel Dir Exists: {channel_dir.exists()}")
    
if __name__ == "__main__":
    test_workspace()
