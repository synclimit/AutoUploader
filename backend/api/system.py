from fastapi import APIRouter, Depends
import tkinter as tk
from tkinter import filedialog
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database.db import get_db
from models import UploadLog

router = APIRouter(prefix="/api/v1/system", tags=["System"])

class BrowseFolderResponse(BaseModel):
    path: Optional[str] = None

import webbrowser

class OpenUrlRequest(BaseModel):
    url: str

@router.post("/open-url")
def open_url(req: OpenUrlRequest):
    webbrowser.open(req.url)
    return {"success": True}

@router.get("/browse-folder", response_model=BrowseFolderResponse)
def browse_folder():
    """Opens a native folder picker dialog on the server machine."""
    import tkinter as tk
    from tkinter import filedialog
    import threading

    folder_path = [None]

    def _open_dialog():
        try:
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            folder_path[0] = filedialog.askdirectory(title="Select Watch Folder")
            root.destroy()
        except Exception as e:
            print("Tkinter error:", e)

    try:
        # Run in a separate thread to ensure Tkinter has its own mainloop if needed
        t = threading.Thread(target=_open_dialog)
        t.start()
        t.join()
        
        if not folder_path[0]:
            return BrowseFolderResponse(path=None)
            
        return BrowseFolderResponse(path=folder_path[0])
    except Exception as e:
        print("Browse folder error:", e)
        return BrowseFolderResponse(path=None)


@router.get("/logs")
def get_system_logs(limit: int = 200, db: Session = Depends(get_db)):
    """Fetches system-wide upload logs ordered by newest first."""
    logs = db.query(UploadLog).order_by(UploadLog.created_at.desc()).limit(limit).all()
    
    result = []
    for log in logs:
        result.append({
            "id": log.id,
            "task_id": log.task_id,
            "status": log.status,
            "message": log.message,
            "created_at": log.created_at.isoformat() + "Z"
        })
        
    return {"success": True, "data": result}

import urllib.request
import json
import os
import tempfile
import subprocess
import threading
import shutil

def run_installer_async(exe_path: str):
    import time
    # Wait a bit so the API response can be sent to the frontend
    time.sleep(2)
    # Launch a detached CMD script that kills AutoUploader and runs the installer
    # taskkill /f /im AutoUploader.exe ensures the python backend (if compiled to exe) is killed.
    script = f'ping 127.0.0.1 -n 3 > nul & taskkill /f /im AutoUploader.exe & start "" "{exe_path}" /SILENT /VERYSILENT /SUPPRESSMSGBOXES /SP-'
    subprocess.Popen(f'cmd.exe /c "{script}"', shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE)


@router.get("/update/check")
def check_update():
    try:
        # Get local version
        version_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "version.json")
        local_version = "v1.0.0"
        if os.path.exists(version_file):
            with open(version_file, "r") as f:
                ver_data = json.load(f)
                local_version = "v" + ver_data.get("version", "1.0.0")

        req = urllib.request.Request("https://api.github.com/repos/synclimit/AutoUploader/releases/latest")
        req.add_header("User-Agent", "AutoUploader-App")
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            
            latest_version = data.get("tag_name", "")
            download_url = ""
            for asset in data.get("assets", []):
                if asset.get("name", "").endswith(".exe"):
                    download_url = asset.get("browser_download_url", "")
                    break
            
            # Simple version comparison
            update_available = False
            if latest_version and latest_version != local_version:
                update_available = True
                
            return {
                "success": True,
                "update_available": update_available,
                "local_version": local_version,
                "latest_version": latest_version,
                "release_notes": data.get("body", ""),
                "download_url": download_url
            }
    except Exception as e:
        print("Update check error:", e)
        return {"success": False, "error": str(e)}

class InstallUpdateRequest(BaseModel):
    download_url: str

@router.post("/update/install")
def install_update(req: InstallUpdateRequest):
    try:
        # Download the file to a temp location
        temp_dir = tempfile.gettempdir()
        installer_path = os.path.join(temp_dir, "AutoUploader_Update.exe")
        
        request = urllib.request.Request(req.download_url)
        request.add_header("User-Agent", "AutoUploader-App")
        with urllib.request.urlopen(request) as response, open(installer_path, 'wb') as out_file:
            shutil.copyfileobj(response, out_file)
            
        # Spawn thread to run installer after delay
        threading.Thread(target=run_installer_async, args=(installer_path,), daemon=True).start()
        
        return {"success": True, "message": "Update downloaded. Application will restart shortly."}
    except Exception as e:
        print("Install update error:", e)
        return {"success": False, "error": str(e)}

