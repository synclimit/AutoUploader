import pytest
from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch, MagicMock

client = TestClient(app)

@patch("api.controllers.oauth_controller.StorageManager.save_json")
@patch("api.controllers.oauth_controller.JsonValidator.validate_and_parse")
def test_upload_credential(mock_validate, mock_save):
    # Success
    mock_validate.return_value = MagicMock()
    # Mocking file upload
    response = client.post(
        "/api/v1/oauth/channels/test-chan/credential/upload",
        files={"file": ("client_secret.json", b'{"installed":{"client_id":"123"}}', "application/json")}
    )
    assert response.status_code == 200
    assert response.json()["success"] is True
    
    # Error
    mock_validate.side_effect = Exception("Invalid JSON")
    response2 = client.post(
        "/api/v1/oauth/channels/test-chan/credential/upload",
        files={"file": ("client_secret.json", b'bad json', "application/json")}
    )
    assert response2.status_code == 200 # Since we wrap all in SuccessResponse/ErrorResponse
    assert response2.json()["success"] is False
    assert response2.json()["error_code"] == "OA500"

@patch("api.controllers.oauth_controller.OAuthFlow.generate_authorization_url")
def test_get_oauth_url(mock_gen):
    mock_res = MagicMock()
    mock_res.auth_url = "http://auth"
    mock_res.state = "state_123"
    mock_gen.return_value = mock_res
    
    response = client.get("/api/v1/oauth/channels/test-chan/url")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["auth_url"] == "http://auth"

@patch("api.controllers.oauth_controller.TokenExchange.exchange_code")
@patch("api.controllers.oauth_controller.OAuthRepository.save_or_update_token")
def test_callback(mock_save, mock_exchange):
    mock_exchange.return_value = MagicMock()
    
    response = client.get("/api/v1/oauth/callback?code=abcd&state=test-chan")
    assert response.status_code == 200
    assert response.json()["success"] is True

@patch("api.controllers.oauth_controller.OAuthRepository.load_token")
@patch("api.controllers.oauth_controller.RefreshService.refresh")
@patch("api.controllers.oauth_controller.OAuthRepository.save_or_update_token")
def test_refresh_token(mock_save, mock_refresh, mock_load):
    mock_load.return_value = MagicMock()
    mock_refresh.return_value = MagicMock()
    
    response = client.post("/api/v1/oauth/channels/test-chan/refresh")
    assert response.status_code == 200
    assert response.json()["success"] is True

@patch("api.controllers.oauth_controller.OAuthHealth.evaluate")
@patch("api.controllers.oauth_controller.OAuthRepository.update_health")
def test_get_health(mock_update, mock_eval):
    from services.oauth_core import OAuthHealthReport, OAuthHealthStatus
    mock_eval.return_value = OAuthHealthReport(status=OAuthHealthStatus.READY, details="OK")
    
    response = client.get("/api/v1/oauth/channels/test-chan/health")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["status"] == "READY"

@patch("api.controllers.oauth_controller.DiagnosticsManager.run_diagnostics")
def test_diagnostics(mock_diag):
    mock_report = MagicMock()
    mock_report.is_healthy = True
    mock_report.issues = []
    mock_diag.return_value = mock_report
    
    response = client.get("/api/v1/oauth/channels/test-chan/diagnostics")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["is_healthy"] is True

@patch("api.controllers.oauth_controller.OAuthFlow.generate_authorization_url")
def test_reconnect(mock_gen):
    mock_res = MagicMock()
    mock_res.auth_url = "http://reconnect"
    mock_res.state = "state"
    mock_gen.return_value = mock_res
    
    response = client.post("/api/v1/oauth/channels/test-chan/reconnect")
    assert response.status_code == 200
    assert response.json()["success"] is True
    assert response.json()["data"]["auth_url"] == "http://reconnect"

if __name__ == "__main__":
    pytest.main(["-v", __file__])
