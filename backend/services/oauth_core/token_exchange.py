from .oauth_flow import OAuthFlow
from .oauth_types import OAuthToken
from .oauth_exceptions import TokenExchangeException

class TokenExchange:
    """
    Tanggung jawab:
    Authorization Code -> Access Token -> Refresh Token -> Expiry -> OAuthToken Object
    Tidak menyimpan ke database.
    """
    
    @classmethod
    def exchange_code(cls, channel_id: str, code: str, redirect_uri: str = None) -> OAuthToken:
        try:
            flow = OAuthFlow._create_flow(channel_id)
            
            # If no redirect_uri provided, use the hardcoded FastAPI port 8000 one.
            # This MUST exactly match what was passed to generate_authorization_url
            if not redirect_uri:
                redirect_uri = "http://127.0.0.1:8000/api/v1/oauth/callback"
                    
            flow.redirect_uri = redirect_uri
            
            # Restore PKCE code verifier if it exists
            verifier = OAuthFlow.get_verifier(channel_id)
            if verifier:
                flow.code_verifier = verifier
            
            flow.fetch_token(code=code)
            creds = flow.credentials
            
            return OAuthToken(
                access_token=creds.token,
                refresh_token=creds.refresh_token,
                expires_at=creds.expiry.isoformat() if creds.expiry else None
            )
        except Exception as e:
            raise TokenExchangeException(f"Failed to exchange authorization code for tokens: {e}")
