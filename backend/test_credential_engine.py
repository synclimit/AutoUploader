import os
import json
import pytest
from pathlib import Path
from unittest.mock import MagicMock, patch

from services.credential_engine import (
    JsonValidator, ProjectValidator, StorageManager, TokenManager,
    HealthManager, DiagnosticsManager, ReconnectManager,
    InvalidCredentialException, DuplicateProjectException, MissingJsonException,
    HealthStatus
)
from services.workspace_manager import WorkspaceManager

# Mocking the database session
class MockSession:
    def __init__(self):
        self.queries = []
        
    def execute(self, query, params=None):
        self.queries.append((query, params))
        # Simple mock for scalar/fetchone
        mock_result = MagicMock()
        mock_result.scalar.return_value = "CONNECTED"
        mock_result.fetchone.return_value = ("access_token", "refresh_token", "test-project-123")
        return mock_result
        
    def commit(self):
        pass

def test_json_valid():
    valid_json = {
        "installed": {
            "client_id": "test-client-id",
            "project_id": "test-project-id",
            "client_secret": "test-secret",
            "auth_uri": "https://auth.uri",
            "token_uri": "https://token.uri",
            "redirect_uris": ["http://localhost"]
        }
    }
    info = JsonValidator.validate_and_parse(json.dumps(valid_json))
    assert info.project_id == "test-project-id"

def test_json_invalid_structure():
    invalid_json = {"wrong_key": {}}
    with pytest.raises(InvalidCredentialException):
        JsonValidator.validate_and_parse(json.dumps(invalid_json))

def test_json_invalid_format():
    with pytest.raises(Exception):
        JsonValidator.validate_and_parse("{invalid_json:")

def test_project_duplicate():
    db = MockSession()
    # Mock finding a duplicate
    mock_result = MagicMock()
    mock_result.fetchone.return_value = ("some-id",)
    db.execute = MagicMock(return_value=mock_result)
    
    with pytest.raises(DuplicateProjectException):
        ProjectValidator.validate_unique(db, "test-project")

def test_storage_save_load_delete():
    WorkspaceManager.initialize()
    channel_id = "test-channel-storage"
    
    # Save
    data = {"test": "data"}
    StorageManager.save_json(channel_id, data)
    assert StorageManager.exists(channel_id)
    
    # Load
    loaded = StorageManager.load_json(channel_id)
    assert loaded == data
    
    # Backup
    StorageManager.backup_json(channel_id)
    backup_file = StorageManager._get_backup_file(channel_id)
    assert backup_file.exists()
    
    # Delete
    StorageManager.delete_json(channel_id)
    assert not StorageManager.exists(channel_id)
    
    # Restore
    StorageManager.restore_json(channel_id)
    assert StorageManager.exists(channel_id)
    
    # Clean up
    StorageManager.delete_json(channel_id)
    backup_file.unlink()

def test_health_status():
    db = MockSession()
    # Test read
    status = HealthManager.get_status(db, "channel-1")
    assert status == HealthStatus.CONNECTED
    
    # Test update
    HealthManager.update_status(db, "channel-1", HealthStatus.QUOTA_EXHAUSTED)
    assert len(db.queries) > 0
    assert db.queries[-1][1]["status"] == "QUOTA_EXHAUSTED"

def test_token_expired():
    # Expired token
    assert TokenManager.is_expired("2020-01-01T00:00:00") is True
    # Missing date
    assert TokenManager.is_expired(None) is True
    assert TokenManager.is_expired("") is True

def test_refresh_counter():
    db = MockSession()
    db.execute = MagicMock()
    db.execute.return_value.scalar.return_value = 1
    
    count = TokenManager.increment_refresh_counter(db, "channel-1")
    assert count == 1
    
    TokenManager.reset_refresh_counter(db, "channel-1")

@patch("services.credential_engine.oauth_manager.OAuthManager.generate_auth_url")
def test_reconnect_begin(mock_generate):
    mock_generate.return_value = ("http://auth", "state")
    db = MockSession()
    
    # Mock no duplicate
    mock_result = MagicMock()
    mock_result.fetchone.return_value = None
    db.execute = MagicMock(return_value=mock_result)
    
    valid_json = {
        "installed": {
            "client_id": "c", "project_id": "p", "client_secret": "s",
            "auth_uri": "a", "token_uri": "t", "redirect_uris": []
        }
    }
    
    WorkspaceManager.initialize()
    auth_url, state = ReconnectManager.begin_reconnect(db, "channel-recon", json.dumps(valid_json), "http://localhost")
    
    assert auth_url == "http://auth"
    assert StorageManager.exists("channel-recon")
    
def test_diagnostic():
    db = MockSession()
    # Must have json to fully pass, assuming channel-recon from previous test exists
    report = DiagnosticsManager.run_diagnostics(db, "channel-recon")
    assert report.json_exists is True
    assert report.token_exists is True
    
if __name__ == "__main__":
    pytest.main(["-v", __file__])
