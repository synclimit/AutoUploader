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

@router.post("/logs/open-folder")
def open_logs_folder():
    from services.system.path_service import PathService
    import os
    try:
        os.startfile(PathService.get_logs_dir())
        return {"success": True}
    except Exception as e:
        return {"success": False, "error": str(e)}

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
    # Use sys.executable if compiled, or default install path
    import sys
    app_exe = sys.executable if sys.executable.endswith("AutoUploader.exe") else r"C:\Program Files (x86)\AutoUploader\AutoUploader.exe"
    app_dir = os.path.dirname(app_exe)
    script = f'ping 127.0.0.1 -n 3 > nul & taskkill /f /im AutoUploader.exe & start /wait "" "{exe_path}" /SILENT /VERYSILENT /SUPPRESSMSGBOXES /SP- & cd /d "{app_dir}" & start "" "{app_exe}"'
    subprocess.Popen(f'cmd.exe /c "{script}"', shell=True, creationflags=subprocess.CREATE_NEW_CONSOLE)


@router.get("/update/check")
def check_update():
    try:
        # Get local version
        import sys
        if getattr(sys, 'frozen', False):
            base_dir = sys._MEIPASS
        else:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
            
        version_file = os.path.join(base_dir, "version.json")
        local_version = "v1.0.0"
        local_build = 0
        if os.path.exists(version_file):
            with open(version_file, "r") as f:
                ver_data = json.load(f)
                local_version = "v" + ver_data.get("version", "1.0.0")
                local_build = ver_data.get("build", 0)

        req = urllib.request.Request("https://api.github.com/repos/synclimit/AutoUploader/releases/latest")
        req.add_header("User-Agent", "AutoUploader-App")
        
        try:
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode())
                
                latest_version = data.get("tag_name", "")
                download_url = ""
                for asset in data.get("assets", []):
                    if asset.get("name", "").endswith(".exe"):
                        download_url = asset.get("browser_download_url", "")
                        break
                
                # Fetch remote version.json to compare build numbers
                remote_build = 0
                try:
                    v_req = urllib.request.Request("https://raw.githubusercontent.com/synclimit/AutoUploader/master/version.json")
                    v_req.add_header("User-Agent", "AutoUploader-App")
                    with urllib.request.urlopen(v_req, timeout=5) as v_res:
                        remote_ver_data = json.loads(v_res.read().decode())
                        remote_build = remote_ver_data.get("build", 0)
                        if remote_ver_data.get("version"):
                            latest_version = "v" + remote_ver_data.get("version")
                except Exception:
                    pass
                
                # Compare builds if available
                update_available = False
                if remote_build > local_build:
                    update_available = True
                elif not remote_build and latest_version and latest_version != "latest" and latest_version != local_version:
                    update_available = True
                    
                return {
                    "success": True,
                    "update_available": update_available,
                    "local_version": f"{local_version} (Build {local_build})",
                    "latest_version": f"{latest_version} (Build {remote_build})" if remote_build else latest_version,
                    "release_notes": data.get("body", ""),
                    "download_url": download_url
                }
        except urllib.error.HTTPError as e:
            if e.code == 404:
                # No releases yet
                return {
                    "success": True,
                    "update_available": False,
                    "local_version": local_version,
                    "latest_version": local_version,
                    "release_notes": "No public releases available yet on GitHub.",
                    "download_url": ""
                }
            raise e
            
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

