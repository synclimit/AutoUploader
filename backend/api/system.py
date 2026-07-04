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
    import subprocess
    import sys
    try:
        script = """
import tkinter as tk
from tkinter import filedialog
import sys
root = tk.Tk()
root.withdraw()
root.attributes('-topmost', True)
folder_path = filedialog.askdirectory(title="Select Watch Folder")
root.destroy()
sys.stdout.write(folder_path)
sys.stdout.flush()
"""
        result = subprocess.run([sys.executable, "-c", script], capture_output=True, text=True)
        folder_path = result.stdout.strip()
        
        if not folder_path:
            return BrowseFolderResponse(path=None)
            
        return BrowseFolderResponse(path=folder_path)
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
