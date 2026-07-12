import pytest
import os
import tempfile
from unittest.mock import MagicMock, patch

from services.upload_engine import (
    UploadManager, UploadRequest, UploadMetadata,
    CredentialUnavailable, OAuthUnavailable, MissingVideo, InvalidMetadata,
    UploadState, QuotaExceeded
)
from services.oauth_core import OAuthHealthReport, OAuthHealthStatus, OAuthToken

# Dummy class for DB testing
class MockDB:
    def __init__(self):
        pass
    def commit(self):
        pass
    def rollback(self):
        pass
    def add(self, obj):
        pass

@pytest.fixture
def mock_video():
    fd, path = tempfile.mkstemp(suffix=".mp4")
    with os.fdopen(fd, 'w') as f:
        f.write("mock video content")
    yield path
    os.remove(path)

@pytest.fixture
def valid_request(mock_video):
    metadata = UploadMetadata(
        title="Test Title",
        description="Test Desc",
        tags=["a", "b"],
        category_id="20",
        privacy_status="private"
    )
    return UploadRequest(
        task_id="task_1",
        channel_id="chan_1",
        video_path=mock_video,
        thumbnail_path=None,
        metadata=metadata
    )

@patch("services.upload_engine.upload_session.MediaFileUpload")
@patch("services.upload_engine.upload_validator.OAuthHealth.evaluate")
@patch("services.upload_engine.upload_manager.OAuthRepository.load_token")
@patch("services.upload_engine.upload_session.build")
@patch("services.upload_engine.upload_session.OAuthClient.load_configuration")
def test_upload_valid(mock_load_conf, mock_build, mock_load_token, mock_health, mock_media_upload, valid_request):
    mock_health.return_value = OAuthHealthReport(status=OAuthHealthStatus.READY, details="")
    mock_load_token.return_value = OAuthToken(access_token="tok", refresh_token="ref", expires_at="2099-01-01T00:00:00")
    
    # Mock youtube api build
    mock_youtube = MagicMock()
    mock_build.return_value = mock_youtube
    
    # Mock next_chunk yield
    mock_insert_req = MagicMock()
    mock_status = MagicMock()
    mock_status.progress.return_value = 1.0
    mock_status.resumable_progress = 1000
    # Simulate single chunk upload completion
    mock_insert_req.next_chunk.return_value = (mock_status, {"id": "youtube_vid_123"})
    mock_youtube.videos().insert.return_value = mock_insert_req
    
    db = MockDB()
    with patch("services.upload_engine.upload_repository.UploadRepository.update_task_state"):
        result = UploadManager.execute_upload(db, valid_request)
        
    assert result.success is True
    assert result.video_id == "youtube_vid_123"

@patch("services.upload_engine.upload_validator.OAuthHealth.evaluate")
def test_credential_unavailable(mock_health, valid_request):
    mock_health.return_value = OAuthHealthReport(status=OAuthHealthStatus.INVALID_CONFIGURATION, details="")
    db = MockDB()
    result = UploadManager.execute_upload(db, valid_request)
    assert result.success is False
    assert result.error_code == "CredentialUnavailable"

@patch("services.upload_engine.upload_validator.OAuthHealth.evaluate")
def test_oauth_unavailable(mock_health, valid_request):
    mock_health.return_value = OAuthHealthReport(status=OAuthHealthStatus.NOT_CONNECTED, details="")
    db = MockDB()
    result = UploadManager.execute_upload(db, valid_request)
    assert result.success is False
    assert result.error_code == "OAuthUnavailable"

def test_missing_video():
    metadata = UploadMetadata(title="A", description="", tags=[], category_id="20", privacy_status="private")
    req = UploadRequest(task_id="t1", channel_id="c1", video_path="/fake/path.mp4", thumbnail_path=None, metadata=metadata)
    db = MockDB()
    result = UploadManager.execute_upload(db, req)
    assert result.success is False
    assert result.error_code == "MissingVideo"

def test_invalid_metadata(mock_video):
    metadata = UploadMetadata(title="", description="", tags=[], category_id="20", privacy_status="private")
    req = UploadRequest(task_id="t1", channel_id="c1", video_path=mock_video, thumbnail_path=None, metadata=metadata)
    db = MockDB()
    result = UploadManager.execute_upload(db, req)
    assert result.success is False
    assert result.error_code == "InvalidMetadata"

@patch("services.upload_engine.upload_session.MediaFileUpload")
@patch("services.upload_engine.upload_manager.OAuthRepository.save_or_update_token")
@patch("services.upload_engine.upload_validator.OAuthHealth.evaluate")
@patch("services.upload_engine.upload_manager.OAuthRepository.load_token")
@patch("services.upload_engine.upload_manager.RefreshService.refresh")
@patch("services.upload_engine.upload_manager.RefreshService.is_expired")
@patch("services.upload_engine.upload_session.build")
@patch("services.upload_engine.upload_session.OAuthClient.load_configuration")
def test_token_expired_auto_refresh(mock_conf, mock_build, mock_is_expired, mock_refresh, mock_load_token, mock_health, mock_save_token, mock_media_upload, valid_request):
    # Setup it to be refreshable
    mock_health.return_value = OAuthHealthReport(status=OAuthHealthStatus.REFRESH_REQUIRED, details="")
    mock_load_token.return_value = OAuthToken(access_token="old_tok", refresh_token="ref", expires_at="2000-01-01T00:00:00")
    
    mock_is_expired.return_value = True
    mock_refresh.return_value = OAuthToken(access_token="new_tok", refresh_token="ref", expires_at="2099-01-01T00:00:00")
    
    mock_youtube = MagicMock()
    mock_build.return_value = mock_youtube
    mock_insert_req = MagicMock()
    mock_insert_req.next_chunk.return_value = (None, {"id": "vid_refreshed_123"})
    mock_youtube.videos().insert.return_value = mock_insert_req
    
    db = MockDB()
    result = UploadManager.execute_upload(db, valid_request)
    assert mock_refresh.called
    assert result.success is True
    assert result.video_id == "vid_refreshed_123"

@patch("services.upload_engine.upload_validator.OAuthHealth.evaluate")
@patch("services.upload_engine.upload_manager.OAuthRepository.load_token")
@patch("services.upload_engine.upload_session.UploadSession.execute")
def test_progress_tracking(mock_execute, mock_load_token, mock_health, valid_request):
    mock_health.return_value = OAuthHealthReport(status=OAuthHealthStatus.READY, details="")
    mock_load_token.return_value = OAuthToken(access_token="tok", refresh_token="ref", expires_at="2099-01-01T00:00:00")
    
    from services.upload_engine.upload_progress import UploadProgress
    from services.upload_engine.upload_result import UploadResult
    from datetime import datetime
    
    def mock_generator():
        yield UploadProgress(status=UploadState.UPLOADING, progress_percentage=10.0, bytes_uploaded=100, speed_bps=10.0, started_at=datetime.utcnow(), estimated_finish=None, message="Uploading")
        yield UploadResult(success=True, video_id="vid_prog", error_code=None, error_message=None, started_at=datetime.utcnow(), finished_at=datetime.utcnow(), elapsed_time_seconds=1.0)
        
    mock_execute.return_value = mock_generator()
    
    db = MockDB()
    with patch("services.upload_engine.upload_repository.UploadRepository.log_progress") as mock_log:
        result = UploadManager.execute_upload(db, valid_request)
        assert mock_log.called
        assert result.success is True
        assert result.video_id == "vid_prog"

if __name__ == "__main__":
    pytest.main(["-v", __file__])
