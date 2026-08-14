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
    """Opens a clean native folder picker dialog without popping up any CMD or PowerShell console window."""
    import sys
    import threading

    folder_path = [None]

    def _open_tkinter():
        try:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            res = filedialog.askdirectory(title="Select Watch Folder")
            root.destroy()
            if res:
                folder_path[0] = res
        except Exception as e:
            print("Tkinter dialog notice:", e)

    # 1. Primary: Native Tkinter dialog (No process spawning, 0 CMD windows)
    try:
        t = threading.Thread(target=_open_tkinter)
        t.start()
        t.join(timeout=30)
        if folder_path[0]:
            return BrowseFolderResponse(path=folder_path[0])
    except Exception as e:
        print("Primary picker notice:", e)

    # 2. Secondary: Silent PowerShell FolderBrowserDialog (CREATE_NO_WINDOW)
    if sys.platform == "win32":
        import subprocess
        script = """
        Add-Type -AssemblyName System.Windows.Forms
        $dlg = New-Object System.Windows.Forms.FolderBrowserDialog
        $dlg.Description = 'Select Watch Folder'
        $dlg.ShowNewFolderButton = $true
        if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
            [Console]::Out.Write($dlg.SelectedPath)
        }
        """
        try:
            out = subprocess.check_output(
                ["powershell", "-NoProfile", "-NonInteractive", "-WindowStyle", "Hidden", "-Command", script],
                creationflags=0x08000000  # CREATE_NO_WINDOW
            )
            path = out.decode("utf-8", errors="ignore").strip()
            if path:
                return BrowseFolderResponse(path=path)
        except Exception as e:
            print("PowerShell folder picker notice:", e)

    return BrowseFolderResponse(path=folder_path[0] or None)


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
import time

update_progress = {
    "status": "idle",
    "progress": 0,
    "downloaded": 0,
    "total": 0,
    "message": ""
}
import os
import tempfile
import subprocess
import threading
import shutil

def run_installer_async(exe_path: str):
    # Wait a bit so the API response can be sent to the frontend
    time.sleep(2)
    import sys
    
    # Dynamically detect installation path of the running application on any machine
    if getattr(sys, 'frozen', False):
        app_exe = sys.executable
        app_dir = os.path.dirname(app_exe)
        exe_name = os.path.basename(app_exe)
    else:
        # Dev mode fallback
        app_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        exe_name = "RaynzPitStop.exe"
        app_exe = os.path.join(app_dir, exe_name)

    clean_app_dir = os.path.normpath(app_dir)
    clean_exe_path = os.path.normpath(exe_path)
    clean_app_exe = os.path.normpath(app_exe)
    
    temp_dir = tempfile.gettempdir()
    bat_path = os.path.join(temp_dir, "run_update.bat")
    ps_path = os.path.join(temp_dir, "run_update.ps1")
    log_path = os.path.join(temp_dir, "update_installer.log")
    
    ps_content = f'''$ErrorActionPreference = "SilentlyContinue"
"[{datetime.now()}] Starting updater script for {clean_app_dir}" | Out-File -FilePath "{log_path}" -Encoding utf8
Start-Sleep -Seconds 1
Get-Process -Name "{os.path.splitext(exe_name)[0]}" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1
$installerArgs = @('/DIR="{clean_app_dir}"', '/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART', '/SP-', '/CLOSEAPPLICATIONS', '/FORCECLOSEAPPLICATIONS')
"[{datetime.now()}] Running installer: {clean_exe_path} with args: $($installerArgs -join ' ')" | Out-File -FilePath "{log_path}" -Append -Encoding utf8
$proc = Start-Process -FilePath "{clean_exe_path}" -ArgumentList $installerArgs -PassThru -Wait
"[{datetime.now()}] Installer exit code: $($proc.ExitCode)" | Out-File -FilePath "{log_path}" -Append -Encoding utf8
Start-Sleep -Seconds 1
if (Test-Path "{clean_app_exe}") {{
    Set-Location -Path "{clean_app_dir}"
    "[{datetime.now()}] Launching updated app: {clean_app_exe}" | Out-File -FilePath "{log_path}" -Append -Encoding utf8
    Start-Process -FilePath "{clean_app_exe}"
}} else {{
    "[{datetime.now()}] App exe not found: {clean_app_exe}" | Out-File -FilePath "{log_path}" -Append -Encoding utf8
}}
'''

    bat_content = f'''@echo off
setlocal
timeout /t 1 /nobreak > nul
taskkill /f /im "{exe_name}" > nul 2>&1
timeout /t 1 /nobreak > nul
powershell -NoProfile -ExecutionPolicy Bypass -File "{ps_path}"
exit
'''
    try:
        with open(ps_path, "w", encoding="utf-8") as f_ps:
            f_ps.write(ps_content)
        with open(bat_path, "w", encoding="utf-8") as f_bat:
            f_bat.write(bat_content)
            
        # 0x00000008 (DETACHED_PROCESS) | 0x00000200 (CREATE_NEW_PROCESS_GROUP)
        DETACHED_FLAGS = 0x00000008 | 0x00000200
        subprocess.Popen(
            ['cmd.exe', '/c', 'start', '""', '/min', bat_path],
            creationflags=DETACHED_FLAGS,
            close_fds=True
        )
    except Exception as e:
        print("Failed to execute update script:", e)


@router.get("/update/check")
def check_update():
    try:
        # Get local version
        import sys
        if getattr(sys, 'frozen', False):
            base_dir = sys._MEIPASS
            exe_dir = os.path.dirname(sys.executable)
            if os.path.exists(os.path.join(exe_dir, "version.json")):
                base_dir = exe_dir
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

        download_url = ""
        latest_version = ""
        release_notes = ""
        remote_build = 0
        
        req = urllib.request.Request("https://api.github.com/repos/synclimit/AutoUploader/releases")
        req.add_header("User-Agent", "AutoUploader-App")
        
        # 1. First attempt: Query GitHub Releases API
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                releases = json.loads(response.read().decode())
                if isinstance(releases, list) and len(releases) > 0:
                    import re
                    for rel in releases:
                        for asset in rel.get("assets", []):
                            if asset.get("name", "").endswith(".exe"):
                                download_url = asset.get("browser_download_url", "")
                                rel_name = rel.get("name", "")
                                rel_body = rel.get("body", "")
                                release_notes = rel_body
                                
                                # Extract build number from release title or body (e.g. "Build 122")
                                m = re.search(r'Build\s+(\d+)', rel_name + " " + rel_body, re.IGNORECASE)
                                if m:
                                    remote_build = int(m.group(1))
                                
                                # Extract version
                                v_m = re.search(r'v?(\d+\.\d+\.\d+)', rel_name, re.IGNORECASE)
                                if v_m:
                                    latest_version = "v" + v_m.group(1)
                                else:
                                    latest_version = rel.get("tag_name", "")
                                break
                        if download_url:
                            break
        except Exception as e:
            print("GitHub Releases API lookup error (will use direct fallback URL):", e)

        # 2. Direct Fallback URL if API response had no executable asset
        if not download_url:
            download_url = "https://github.com/synclimit/AutoUploader/releases/download/latest/RaynzPitStop_Setup.exe"
            
        # 3. If remote_build was not found in release title, fetch remote version.json
        if not remote_build:
            try:
                v_req = urllib.request.Request("https://raw.githubusercontent.com/synclimit/AutoUploader/master/version.json")
                v_req.add_header("User-Agent", "AutoUploader-App")
                with urllib.request.urlopen(v_req, timeout=5) as v_res:
                    remote_ver_data = json.loads(v_res.read().decode())
                    remote_build = remote_ver_data.get("build", 0)
                    if remote_ver_data.get("version"):
                        latest_version = "v" + remote_ver_data.get("version")
            except Exception as e:
                print("Remote version.json check error:", e)
        
        # 4. Compare builds
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
            "release_notes": release_notes or "Automatic performance improvements and bug fixes.",
            "download_url": download_url,
            "install_path": os.path.dirname(sys.executable)
        }
            
    except Exception as e:
        print("Update check error:", e)
        return {"success": False, "error": str(e)}

class InstallUpdateRequest(BaseModel):
    download_url: str

def download_and_install_async(download_url: str, installer_path: str):
    global update_progress
    update_progress["status"] = "downloading"
    update_progress["progress"] = 0
    update_progress["downloaded"] = 0
    update_progress["total"] = 0
    update_progress["message"] = "Starting download..."
    
    try:
        req = urllib.request.Request(download_url)
        req.add_header("User-Agent", "AutoUploader-App")
        with urllib.request.urlopen(req) as response:
            total_size = int(response.info().get('Content-Length', 0))
            update_progress["total"] = total_size
            downloaded = 0
            chunk_size = 8192
            
            with open(installer_path, 'wb') as out_file:
                while True:
                    chunk = response.read(chunk_size)
                    if not chunk:
                        break
                    out_file.write(chunk)
                    downloaded += len(chunk)
                    update_progress["downloaded"] = downloaded
                    if total_size > 0:
                        update_progress["progress"] = min(100, int((downloaded / total_size) * 100))
        
        is_frozen = getattr(sys, 'frozen', False)
        if is_frozen:
            update_progress["status"] = "installing"
            update_progress["progress"] = 100
            update_progress["message"] = "Download complete. Installing and restarting..."
            run_installer_async(installer_path)
        else:
            update_progress["status"] = "dev_mode_downloaded"
            update_progress["progress"] = 100
            update_progress["message"] = f"Download complete! Installer saved to {installer_path}. Running installer..."
            run_installer_async(installer_path)
    except Exception as e:
        print("Download error:", e)
        update_progress["status"] = "error"
        update_progress["message"] = str(e)


@router.post("/update/install")
def install_update(req: InstallUpdateRequest):
    try:
        # Check if already downloading
        if update_progress["status"] == "downloading":
            return {"success": True, "message": "Download already in progress."}
            
        # Download the file to a temp location
        temp_dir = tempfile.gettempdir()
        installer_path = os.path.join(temp_dir, "AutoUploader_Update.exe")
        
        # Spawn thread to download and run installer
        threading.Thread(target=download_and_install_async, args=(req.download_url, installer_path), daemon=True).start()
        
        return {"success": True, "message": "Update download started. Application will restart shortly."}
    except Exception as e:
        print("Install update error:", e)
        return {"success": False, "error": str(e)}

@router.get("/update/progress")
def get_update_progress():
    return {"success": True, "data": update_progress}

@router.get("/app-logs")
def get_app_logs(lines: int = 500):
    """Fetches the last N lines from the autouploader.log file."""
    from services.system.path_service import PathService
    import os
    import collections
    
    log_file = os.path.join(PathService.get_logs_dir(), "autouploader.log")
    if not os.path.exists(log_file):
        return {"success": True, "logs": "No log file found at: " + log_file}
        
    try:
        with open(log_file, "r", encoding="utf-8", errors="replace") as f:
            last_lines = collections.deque(f, lines)
            return {"success": True, "logs": "".join(last_lines)}
    except Exception as e:
        return {"success": False, "error": str(e)}

