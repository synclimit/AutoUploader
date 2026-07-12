import pytest
import json
from unittest.mock import MagicMock, patch

from services.oauth_core import (
    OAuthClient, OAuthFlow, TokenExchange, RefreshService, 
    OAuthValidator, OAuthHealth, OAuthRepository,
    OAuthConfigurationException, TokenExchangeException, RefreshTokenException,
    OAuthToken, OAuthHealthStatus
)

# Dummy class for DB testing
class MockDB:
    def __init__(self):
        self.added = []
    def query(self, model):
        mock_query = MagicMock()
        mock_query.filter_by.return_value.first.return_value = None
        return mock_query
    def add(self, obj):
        self.added.append(obj)
    def commit(self):
        pass
    def rollback(self):
        pass

@patch('services.credential_engine.StorageManager.load_json')
def test_valid_client_secret(mock_load):
    mock_load.return_value = {
        "installed": {
            "client_id": "c_id", "project_id": "p_id", "client_secret": "sec",
            "auth_uri": "a", "token_uri": "t", "redirect_uris": ["http://localhost"]
        }
    }
    config = OAuthClient.load_configuration("chan_1")
    assert config.client_id == "c_id"

@patch('services.credential_engine.StorageManager.load_json')
def test_invalid_client_secret(mock_load):
    mock_load.return_value = {"invalid": "format"}
    with pytest.raises(OAuthConfigurationException):
        OAuthClient.load_configuration("chan_1")

@patch('services.credential_engine.StorageManager.load_json')
def test_generate_oauth_url(mock_load):
    mock_load.return_value = {
        "installed": {
            "client_id": "c", "project_id": "p", "client_secret": "s",
            "auth_uri": "a", "token_uri": "t", "redirect_uris": ["http://localhost"]
        }
    }
    # Using patch on Flow.authorization_url
    with patch('services.oauth_core.oauth_flow.Flow.authorization_url') as mock_auth:
        mock_auth.return_value = ("http://auth_url", "mock_state")
        res = OAuthFlow.generate_authorization_url("chan_1")
        assert res.auth_url == "http://auth_url"
        assert res.state == "mock_state"

@patch('services.credential_engine.StorageManager.load_json')
def test_invalid_redirect_uri(mock_load):
    mock_load.return_value = {
        "installed": {
            "client_id": "c", "project_id": "p", "client_secret": "s",
            "auth_uri": "a", "token_uri": "t", "redirect_uris": ["http://invalid-redirect"]
        }
    }
    with pytest.raises(OAuthConfigurationException, match="No suitable redirect_uri"):
        OAuthFlow.generate_authorization_url("chan_1")

@patch('services.oauth_core.oauth_flow.OAuthFlow._create_flow')
def test_token_exchange(mock_create):
    mock_flow = MagicMock()
    mock_flow.credentials.token = "access_t"
    mock_flow.credentials.refresh_token = "refresh_t"
    mock_flow.credentials.expiry = None
    mock_create.return_value = mock_flow
    
    with patch('services.oauth_core.oauth_client.OAuthClient.load_configuration') as mock_conf:
        mock_conf.return_value.redirect_uris = ["http://localhost"]
        token = TokenExchange.exchange_code("chan_1", "auth_code")
        assert token.access_token == "access_t"

def test_expired_token():
    token = OAuthToken(access_token="a", refresh_token="r", expires_at="2000-01-01T00:00:00")
    assert RefreshService.is_expired(token) is True

@patch('services.oauth_core.refresh_service.Credentials')
def test_refresh_token(mock_creds_class):
    mock_creds = MagicMock()
    mock_creds.token = "new_a"
    mock_creds.refresh_token = "new_r"
    mock_creds.expiry = None
    mock_creds_class.return_value = mock_creds
    
    with patch('services.oauth_core.oauth_client.OAuthClient.load_configuration') as mock_conf:
        mock_conf.return_value = MagicMock()
        old_token = OAuthToken(access_token="old_a", refresh_token="old_r", expires_at="2000")
        new_token = RefreshService.refresh("chan", old_token)
        assert new_token.access_token == "new_a"

def test_refresh_failed_no_refresh_token():
    old_token = OAuthToken(access_token="a", refresh_token=None, expires_at=None)
    with pytest.raises(RefreshTokenException):
        RefreshService.refresh("chan", old_token)

def test_repository_save():
    db = MockDB()
    token = OAuthToken(access_token="a", refresh_token="r", expires_at=None)
    OAuthRepository.save_or_update_token(db, "chan", token)
    assert len(db.added) == 1
    assert db.added[0].access_token == "a"

@patch('services.oauth_core.oauth_validator.OAuthClient.load_configuration')
@patch('services.oauth_core.oauth_health.OAuthRepository.load_token')
def test_oauth_health(mock_load_token, mock_conf):
    # Invalid config
    mock_conf.side_effect = OAuthConfigurationException("bad config")
    rep = OAuthHealth.evaluate(None, "chan")
    assert rep.status == OAuthHealthStatus.INVALID_CONFIGURATION
    
    # Valid config, no token
    mock_conf.side_effect = None
    from services.oauth_core import OAuthConfiguration
    mock_conf.return_value = OAuthConfiguration(
        client_id="c", project_id="p", client_secret="s", 
        auth_uri="a", token_uri="t", redirect_uris=["http://localhost"], scopes=["scope"]
    )
    mock_load_token.return_value = None
    rep = OAuthHealth.evaluate(None, "chan")
    assert rep.status == OAuthHealthStatus.NOT_CONNECTED
    
    # Valid config, valid token
    mock_load_token.return_value = OAuthToken(access_token="a", refresh_token="r", expires_at="2099-01-01T00:00:00")
    rep = OAuthHealth.evaluate(None, "chan")
    assert rep.status == OAuthHealthStatus.READY

if __name__ == "__main__":
    pytest.main(["-v", __file__])
