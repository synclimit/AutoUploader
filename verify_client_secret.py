import os
import json
from backend.core.config import CLIENT_SECRET_PATH
from google_auth_oauthlib.flow import InstalledAppFlow

def run_validation():
    print("[OAUTH]")
    print("Client Secret:")
    print(str(CLIENT_SECRET_PATH))
    print()
    
    file_exists = os.path.exists(CLIENT_SECRET_PATH)
    print(f"File exists: {'PASS' if file_exists else 'FAIL'}")
    
    if not file_exists:
        return
        
    json_loads = False
    try:
        with open(CLIENT_SECRET_PATH, 'r') as f:
            json.load(f)
        json_loads = True
    except Exception as e:
        print(f"JSON Parse Error: {e}")
        
    print(f"JSON parse: {'PASS' if json_loads else 'FAIL'}")
    
    if not json_loads:
        return
        
    oauth_init = False
    try:
        SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
        flow = InstalledAppFlow.from_client_secrets_file(
            str(CLIENT_SECRET_PATH),
            SCOPES
        )
        oauth_init = True
    except Exception as e:
        print(f"OAuth Init Error: {e}")
        
    print(f"OAuth initialization: {'PASS' if oauth_init else 'FAIL'}")

if __name__ == "__main__":
    run_validation()
