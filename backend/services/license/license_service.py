import os
import json
import base64
import rsa
from pathlib import Path
from .hardware_service import get_hardware_id
from services.system.path_service import PathService

APP_DATA_DIR = Path(PathService.get_appdata_dir())
LICENSE_PATH = Path(PathService.get_license_path())

# Path to the bundled public key
PUBLIC_KEY_PATH = Path(PathService.get_public_key_path())

def get_public_key() -> rsa.PublicKey:
    if not PUBLIC_KEY_PATH.exists():
        raise FileNotFoundError("Public key not found in the application.")
    with open(PUBLIC_KEY_PATH, 'rb') as f:
        key_data = f.read()
    return rsa.PublicKey.load_pkcs1(key_data)

def verify_signature(payload_str: str, signature_b64: str) -> bool:
    try:
        pub_key = get_public_key()
        signature = base64.b64decode(signature_b64)
        rsa.verify(payload_str.encode('utf-8'), signature, pub_key)
        return True
    except Exception:
        return False

def verify_hardware(licensed_hardware_id: str) -> bool:
    return licensed_hardware_id == get_hardware_id()

def load_license():
    if not LICENSE_PATH.exists():
        return None
    try:
        with open(LICENSE_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return None

def get_status() -> dict:
    current_hw_id = get_hardware_id()
    
    lic_data = load_license()
    if not lic_data:
        return {
            "valid": False,
            "status": "Application Not Activated",
            "hardware_id": current_hw_id
        }
        
    payload = lic_data.get('payload')
    signature = lic_data.get('signature')
    
    if not payload or not signature:
        return {
            "valid": False,
            "status": "License Corrupted",
            "error": "Please contact developer.",
            "hardware_id": current_hw_id
        }
        
    # Serialize payload identically as the generator
    payload_str = json.dumps(payload, separators=(',', ':'), sort_keys=True)
    
    if not verify_signature(payload_str, signature):
        return {
            "valid": False,
            "status": "License Corrupted",
            "error": "Please contact developer.",
            "hardware_id": current_hw_id
        }
        
    if not verify_hardware(payload.get("hardware_id")):
        return {
            "valid": False,
            "status": "License Invalid",
            "error": "This license belongs to another computer.",
            "hardware_id": current_hw_id
        }
        
    return {
        "valid": True,
        "status": "Activated",
        "hardware_id": current_hw_id,
        "license": payload
    }
    
def save_license(license_content: dict) -> bool:
    """Save the license file locally."""
    try:
        APP_DATA_DIR.mkdir(parents=True, exist_ok=True)
        with open(LICENSE_PATH, 'w', encoding='utf-8') as f:
            json.dump(license_content, f, indent=4)
        return True
    except Exception:
        return False
