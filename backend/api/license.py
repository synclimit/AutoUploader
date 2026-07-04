from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import Dict, Any
import json
from services.license.license_service import get_status, save_license

router = APIRouter(prefix="/api/v1/license", tags=["License"])

@router.get("/status")
async def get_license_status() -> Dict[str, Any]:
    """Check if the application is activated."""
    return get_status()

@router.post("/import")
async def import_license(file: UploadFile = File(...)):
    """Import a new license file (license.lic)."""
    if not file.filename.endswith(".lic"):
        raise HTTPException(status_code=400, detail="Invalid file format. Must be a .lic file.")
        
    try:
        content_bytes = await file.read()
        license_data = json.loads(content_bytes.decode('utf-8'))
        
        # Save it to APPDATA
        if save_license(license_data):
            # Verify immediately
            status = get_status()
            if status.get("valid"):
                return {"success": True, "message": "License activated successfully.", "data": status}
            else:
                return {"success": False, "message": status.get("status"), "data": status}
        else:
            return {"success": False, "message": "Failed to write license file locally."}
            
    except json.JSONDecodeError:
        return {"success": False, "message": "File is corrupted or not a valid JSON payload."}
    except Exception as e:
        return {"success": False, "message": f"Error importing license: {str(e)}"}
