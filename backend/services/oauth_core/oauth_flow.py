from google_auth_oauthlib.flow import Flow
from typing import Dict, Any

from .oauth_client import OAuthClient
from .oauth_types import AuthorizationResult
from .oauth_exceptions import OAuthConnectionException, OAuthConfigurationException

class OAuthFlow:
    """
    Tanggung jawab:
    - Generate OAuth URL
    - Open Authentication Flow
    - Return Authorization Code parameter needed info (redirect uri, etc)
    Tidak boleh menukar token.
    """
    
    _temp_verifiers: Dict[str, str] = {}

    @staticmethod
    def _create_flow(channel_id: str) -> Flow:
        try:
            config = OAuthClient.load_configuration(channel_id)
            
            # Reconstruct the dict that google-auth expects
            client_config: Dict[str, Any] = {
                "installed": {
                    "client_id": config.client_id,
                    "project_id": config.project_id,
                    "client_secret": config.client_secret,
                    "auth_uri": config.auth_uri,
                    "token_uri": config.token_uri,
                    "redirect_uris": config.redirect_uris
                }
            }
            
            flow = Flow.from_client_config(
                client_config=client_config,
                scopes=config.scopes
            )
            return flow
        except OAuthConfigurationException as e:
            raise e
        except Exception as e:
            raise OAuthConnectionException(f"Failed to create OAuth flow: {e}")

    @classmethod
    def generate_authorization_url(cls, channel_id: str, redirect_uri: str = None) -> AuthorizationResult:
        flow = cls._create_flow(channel_id)
        
        # Determine redirect URI: use provided or fallback to first valid local one
        if not redirect_uri:
            # We must route the callback to our FastAPI backend port 8000.
            # For "installed" (Desktop) apps, Google allows any localhost port/path.
            redirect_uri = "http://127.0.0.1:8000/api/v1/oauth/callback"
            
        flow.redirect_uri = redirect_uri
        
        try:
            auth_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent',
                state=channel_id
            )
            
            # Save the PKCE code verifier so the callback can use it
            if hasattr(flow, 'code_verifier'):
                cls._temp_verifiers[channel_id] = flow.code_verifier
                
            return AuthorizationResult(auth_url=auth_url, state=state)
        except Exception as e:
            raise OAuthConnectionException(f"Failed to generate auth url: {e}")
            
    @classmethod
    def get_verifier(cls, channel_id: str) -> str:
        return cls._temp_verifiers.pop(channel_id, None)
