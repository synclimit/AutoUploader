from services.credential_engine import StorageManager, JsonValidator, MissingJsonException, ValidationException
from .oauth_types import OAuthConfiguration
from .oauth_exceptions import OAuthConfigurationException

class OAuthClient:
    """
    Tanggung jawab:
    - membaca client_secret.json (lewat StorageManager / WorkspaceEngine)
    - validasi credential (secara internal OAuth)
    - mengelola konfigurasi OAuth
    Tidak menyimpan token. Tidak melakukan login.
    """
    
    # Scopes explicitly defined as requested
    YOUTUBE_SCOPES = [
        "https://www.googleapis.com/auth/youtube.upload",
        "https://www.googleapis.com/auth/youtube",
        "https://www.googleapis.com/auth/youtube.readonly"
    ]
    
    @staticmethod
    def load_configuration(channel_id: str) -> OAuthConfiguration:
        try:
            # We use Phase 2's StorageManager
            import json
            raw_data = StorageManager.load_json(channel_id)
            # Re-use JsonValidator to parse structure
            cred_info = JsonValidator.validate_and_parse(json.dumps(raw_data))
            
            return OAuthConfiguration(
                client_id=cred_info.client_id,
                project_id=cred_info.project_id,
                client_secret=cred_info.client_secret,
                auth_uri=cred_info.auth_uri,
                token_uri=cred_info.token_uri,
                redirect_uris=cred_info.redirect_uris,
                scopes=OAuthClient.YOUTUBE_SCOPES
            )
        except MissingJsonException:
            raise OAuthConfigurationException(f"Missing client_secret.json for channel {channel_id}")
        except ValidationException as e:
            raise OAuthConfigurationException(f"Invalid credential format: {e}")
        except Exception as e:
            raise OAuthConfigurationException(f"Failed to load OAuth configuration: {e}")
