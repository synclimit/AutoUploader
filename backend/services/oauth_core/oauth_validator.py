import json
from .oauth_client import OAuthClient
from .oauth_types import OAuthValidationResult
from .oauth_exceptions import OAuthConfigurationException

class OAuthValidator:
    """
    Tanggung jawab:
    Validasi: client_secret.json, redirect uri, scopes, project id, client id, oauth configuration.
    Output: ValidationResult
    """
    
    @staticmethod
    def validate_configuration(channel_id: str) -> OAuthValidationResult:
        errors = []
        try:
            config = OAuthClient.load_configuration(channel_id)
            
            if not config.client_id:
                errors.append("Client ID is missing")
                
            if not config.project_id:
                errors.append("Project ID is missing")
                
            if not config.client_secret:
                errors.append("Client Secret is missing")
                
            if not config.scopes or len(config.scopes) == 0:
                errors.append("Scopes are not configured")
                
            if not config.redirect_uris or len(config.redirect_uris) == 0:
                errors.append("Redirect URIs are missing")
                
            # Usually for desktop we need localhost or urn:ietf:wg:oauth:2.0:oob
            valid_uris = [uri for uri in config.redirect_uris if 'localhost' in uri or 'urn:ietf:wg:oauth:2.0:oob' in uri]
            if not valid_uris:
                errors.append("No valid local redirect URI found for desktop application.")
                
        except OAuthConfigurationException as e:
            errors.append(str(e))
            
        return OAuthValidationResult(
            is_valid=len(errors) == 0,
            errors=errors
        )
