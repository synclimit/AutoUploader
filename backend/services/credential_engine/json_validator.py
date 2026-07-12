import json
from typing import Dict, Any
from .types import CredentialInfo
from .exceptions import ValidationException, InvalidCredentialException

class JsonValidator:
    """
    Tanggung jawab:
    - membaca file upload/dict
    - parsing JSON
    - validasi struktur
    - validasi key Google OAuth
    """
    
    @staticmethod
    def validate_and_parse(content: str) -> CredentialInfo:
        try:
            data = json.loads(content)
        except json.JSONDecodeError as e:
            raise ValidationException(f"Invalid JSON format: {e}")
            
        # Check installed or web
        auth_type = None
        if "installed" in data:
            auth_type = "installed"
        elif "web" in data:
            auth_type = "web"
        else:
            raise InvalidCredentialException("Missing 'installed' or 'web' key in JSON")
            
        auth_data = data[auth_type]
        
        required_keys = ["client_id", "project_id", "client_secret", "auth_uri", "token_uri", "redirect_uris"]
        for key in required_keys:
            if key not in auth_data:
                raise InvalidCredentialException(f"Missing required key: {key}")
                
        return CredentialInfo(
            client_id=auth_data["client_id"],
            project_id=auth_data["project_id"],
            client_secret=auth_data["client_secret"],
            auth_uri=auth_data["auth_uri"],
            token_uri=auth_data["token_uri"],
            redirect_uris=auth_data["redirect_uris"],
            raw_json=data
        )
