import sys
import os
import json
import time
import tempfile
import threading
import subprocess
import urllib.request
from datetime import datetime

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
    """Opens modern Windows File Explorer folder picker dialog (IFileOpenDialog)."""
    from services.system.folder_picker import open_modern_folder_picker
    path = open_modern_folder_picker()
    return BrowseFolderResponse(path=path)


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

import ssl

def _get_ssl_context():
    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    except Exception:
        return None

def _safe_urlopen(req, timeout=10):
    try:
        return urllib.request.urlopen(req, timeout=timeout)
    except Exception:
        ctx = _get_ssl_context()
        if ctx:
            return urllib.request.urlopen(req, timeout=timeout, context=ctx)
        raise

update_progress = {
    "status": "idle",
    "progress": 0,
    "downloaded": 0,
    "total": 0,
    "message": ""
}

def run_installer_async(exe_path: str):
    # Wait a bit so the API response can be sent to the frontend
    time.sleep(2)
    import sys
    
    # Dynamically detect installation path of the running application on any machine
    if getattr(sys, 'frozen', False):
        app_exe = sys.executable
        app_dir = os.path.dirname(app_exe)
    else:
        # Dev mode fallback
        app_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        app_exe = os.path.join(app_dir, "RaynzPitStop.exe")

    clean_app_dir = os.path.normpath(app_dir).rstrip('\\/')
    clean_exe_path = os.path.normpath(exe_path)
    clean_app_exe = os.path.normpath(app_exe)
    
    temp_dir = tempfile.gettempdir()
    bat_path = os.path.join(temp_dir, "run_update.bat")
    ps_path = os.path.join(temp_dir, "run_update.ps1")
    log_path = os.path.join(temp_dir, "update_installer.log")
    
    ps_content = f'''$ErrorActionPreference = "SilentlyContinue"
$rawDir = "{clean_app_dir}".TrimEnd('\\', '/')
"[{datetime.now()}] Starting updater script for $rawDir" | Out-File -FilePath "{log_path}" -Encoding utf8
Start-Sleep -Seconds 2
Get-Process -Name "RaynzPitStop", "RaynzPitStop_App", "AutoUploader" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
$installerArgs = @("/DIR=`"$rawDir`"", '/VERYSILENT', '/SUPPRESSMSGBOXES', '/NORESTART', '/SP-', '/CLOSEAPPLICATIONS', '/FORCECLOSEAPPLICATIONS')
"[{datetime.now()}] Running elevated installer: {clean_exe_path} with args: $($installerArgs -join ' ')" | Out-File -FilePath "{log_path}" -Append -Encoding utf8
$proc = Start-Process -FilePath "{clean_exe_path}" -ArgumentList $installerArgs -WindowStyle Hidden -PassThru -Wait
"[{datetime.now()}] Installer exit code: $($proc.ExitCode)" | Out-File -FilePath "{log_path}" -Append -Encoding utf8
Start-Sleep -Seconds 2

$targetExe = "{clean_app_exe}"
if (-not (Test-Path -LiteralPath $targetExe)) {{
    $fallbackExe = Join-Path "$rawDir" "RaynzPitStop.exe"
    if (Test-Path -LiteralPath $fallbackExe) {{
        $targetExe = $fallbackExe
    }} else {{
        $fallbackExe2 = Join-Path "$rawDir" "RaynzPitStop_App.exe"
        if (Test-Path -LiteralPath $fallbackExe2) {{
            $targetExe = $fallbackExe2
        }}
    }}
}}

if (Test-Path -LiteralPath $targetExe) {{
    "[{datetime.now()}] Launching updated app: $targetExe" | Out-File -FilePath "{log_path}" -Append -Encoding utf8
    Start-Process -FilePath "$targetExe" -WorkingDirectory "$rawDir"
}} else {{
    "[{datetime.now()}] App exe not found at: {clean_app_exe}" | Out-File -FilePath "{log_path}" -Append -Encoding utf8
}}
'''

    vbs_path = os.path.join(temp_dir, "run_update.vbs")
    vbs_content = f'''Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -WindowStyle Hidden -NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{ps_path}""", 0, False
'''

    try:
        with open(ps_path, "w", encoding="utf-8") as f_ps:
            f_ps.write(ps_content)
        with open(vbs_path, "w", encoding="utf-8") as f_vbs:
            f_vbs.write(vbs_content)
            
        CREATE_NO_WINDOW = 0x08000000
        DETACHED_FLAGS = 0x00000008 | 0x00000200 | CREATE_NO_WINDOW
        subprocess.Popen(
            ['wscript.exe', vbs_path],
            cwd=temp_dir,
            creationflags=DETACHED_FLAGS,
            close_fds=True
        )
    except Exception as e:
        print("Failed to execute update script:", e)


@router.get("/update/check")
def check_update():
    try:
        # Get local version with MEIPASS / internal priority
        import sys
        if getattr(sys, 'frozen', False):
            exe_dir = os.path.dirname(sys.executable)
            mei_dir = getattr(sys, '_MEIPASS', exe_dir)
            version_file = os.path.join(mei_dir, "version.json")
            if not os.path.exists(version_file):
                internal_ver = os.path.join(exe_dir, "_internal", "version.json")
                if os.path.exists(internal_ver):
                    version_file = internal_ver
                else:
                    version_file = os.path.join(exe_dir, "version.json")
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

        download_url = "https://github.com/synclimit/AutoUploader/releases/download/latest/RaynzPitStop_Setup.exe"
        latest_version = ""
        release_notes = ""
        asset_build = 0
        
        # 1. Query GitHub Releases API for tag 'latest' specifically
        tag_req = urllib.request.Request("https://api.github.com/repos/synclimit/AutoUploader/releases/tags/latest")
        tag_req.add_header("User-Agent", "AutoUploader-App")
        try:
            with _safe_urlopen(tag_req, timeout=10) as response:
                rel = json.loads(response.read().decode())
                if isinstance(rel, dict):
                    import re
                    for asset in rel.get("assets", []):
                        if asset.get("name", "").endswith(".exe"):
                            download_url = asset.get("browser_download_url", "")
                            rel_name = rel.get("name", "")
                            rel_body = rel.get("body", "")
                            release_notes = rel_body
                            
                            m = re.search(r'Build\s+(\d+)', rel_name + " " + rel_body, re.IGNORECASE)
                            if m:
                                asset_build = int(m.group(1))
                            
                            v_m = re.search(r'v?(\d+\.\d+\.\d+)', rel_name + " " + rel_body, re.IGNORECASE)
                            if v_m:
                                latest_version = "v" + v_m.group(1)
                            break
        except Exception as e:
            print("GitHub Releases API tag latest lookup error:", e)

        remote_build = asset_build if asset_build else local_build

        # 4. Compare builds: Only offer update if uploaded release asset build > local build
        update_available = False
        if asset_build > local_build:
            update_available = True
        elif latest_version and latest_version != "latest" and latest_version != local_version and asset_build > local_build:
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
        with _safe_urlopen(req, timeout=60) as response:
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

        # Validate downloaded binary file (Must be a PE executable starting with 'MZ')
        if os.path.exists(installer_path):
            with open(installer_path, 'rb') as check_f:
                header = check_f.read(2)
                if header != b'MZ':
                    from services.system.diagnostic_service import diagnostic_service
                    diagnostic_service.log("ERROR", "UPDATE", "INVALID_PE_HEADER", "Downloaded installer package header is not PE executable.", error_id="ERR-UPDATE-004")
                    raise ValueError("Downloaded installer package is invalid or corrupt (received non-executable payload).")

        from services.system.diagnostic_service import diagnostic_service
        from services.system.path_service import PathService
        diagnostic_service.log("INFO", "UPDATE", "DOWNLOAD_SUCCESS", f"Update downloaded successfully to {installer_path}")
        
        # Save pending update verification file
        try:
            update_flag_file = os.path.join(PathService.get_logs_dir(), "pending_update_verify.json")
            with open(update_flag_file, "w") as uf:
                json.dump({"expected_version": update_progress.get("latest_version", "unknown"), "timestamp": time.time()}, uf)
        except Exception:
            pass

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
        from services.system.diagnostic_service import diagnostic_service
        diagnostic_service.log("ERROR", "UPDATE", "DOWNLOAD_FAILED", f"Update download failed: {e}", error_id="ERR-UPDATE-002", exc_info=e)
        update_progress["status"] = "error"
        update_progress["message"] = str(e)


@router.post("/update/install")
def install_update(req: InstallUpdateRequest):
    try:
        if update_progress["status"] == "downloading":
            return {"success": True, "message": "Download already in progress."}
            
        temp_dir = tempfile.gettempdir()
        timestamp = int(time.time())
        installer_path = os.path.join(temp_dir, f"RaynzPitStop_Update_{timestamp}.exe")
        
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

@router.get("/diagnostic/summary")
def get_diagnostic_summary():
    """Returns application metrics, telemetry, and error summary."""
    from services.system.diagnostic_service import DiagnosticService
    return {"success": True, "data": DiagnosticService.get_summary()}

@router.get("/diagnostic/logs")
def get_diagnostic_logs(
    limit: int = 200,
    module: Optional[str] = None,
    level: Optional[str] = None,
    search: Optional[str] = None
):
    """Returns filtered diagnostic logs."""
    from services.system.diagnostic_service import diagnostic_service
    logs = diagnostic_service.get_logs(limit=limit, module=module, level=level, search=search)
    return {"success": True, "data": logs}

@router.post("/diagnostic/export")
def export_diagnostic_report():
    """Generates a redacted diagnostic ZIP archive for gravity/developer analysis."""
    from services.system.diagnostic_service import diagnostic_service
    from fastapi.responses import FileResponse
    try:
        zip_path = diagnostic_service.export_report_zip()
        filename = os.path.basename(zip_path)
        return FileResponse(
            path=zip_path,
            filename=filename,
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        return {"success": False, "error": str(e)}

