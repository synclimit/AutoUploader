from google_auth_oauthlib.flow import Flow
from .storage_manager import StorageManager
from .types import OAuthToken
from .exceptions import OAuthFailedException, MissingJsonException

SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.readonly"
]

class OAuthManager:
    """
    Tanggung jawab:
    - generate OAuth URL
    - callback (exchange code)
    - save token (to model, not db directly)
    - revoke
    - reconnect (re-trigger oauth)
    """
    
    @staticmethod
    def _create_flow(channel_id: str) -> Flow:
        file_path = str(StorageManager._get_secret_file(channel_id))
        try:
            flow = Flow.from_client_secrets_file(
                file_path,
                scopes=SCOPES,
                redirect_uri='urn:ietf:wg:oauth:2.0:oob' # Adjust for desktop app if needed, usually local port
            )
            return flow
        except Exception as e:
            raise OAuthFailedException(f"Failed to create OAuth flow: {e}")

    @classmethod
    def generate_auth_url(cls, channel_id: str, redirect_uri: str) -> tuple[str, str]:
        """Returns (auth_url, state)"""
        if not StorageManager.exists(channel_id):
            raise MissingJsonException(f"Missing credential file for {channel_id}")
            
        flow = cls._create_flow(channel_id)
        flow.redirect_uri = redirect_uri
        
        try:
            auth_url, state = flow.authorization_url(
                access_type='offline',
                include_granted_scopes='true',
                prompt='consent'
            )
            return auth_url, state
        except Exception as e:
            raise OAuthFailedException(f"Failed to generate auth url: {e}")

    @classmethod
    def exchange_code(cls, channel_id: str, redirect_uri: str, code: str) -> OAuthToken:
        flow = cls._create_flow(channel_id)
        flow.redirect_uri = redirect_uri
        
        try:
            flow.fetch_token(code=code)
            creds = flow.credentials
            
            return OAuthToken(
                access_token=creds.token,
                refresh_token=creds.refresh_token,
                expires_at=creds.expiry.isoformat() if creds.expiry else None
            )
        except Exception as e:
            raise OAuthFailedException(f"Failed to exchange code: {e}")
