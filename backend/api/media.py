import os
import mimetypes
from fastapi import APIRouter, Depends, HTTPException, Request, status, UploadFile, File, Response
from sqlalchemy.orm import Session
from starlette.responses import StreamingResponse, FileResponse
import shutil
from database.db import get_db
from models import UploadTask

router = APIRouter(prefix="/api/v1/media", tags=["Media"])

def _range_requests_response(request: Request, file_path: str, content_type: str):
    """
    Returns a StreamingResponse supporting HTTP 206 Partial Content (Range requests)
    for scrub/seek support in HTML5 video players.
    """
    try:
        file_size = os.path.getsize(file_path)
    except OSError:
        raise HTTPException(status_code=404, detail="File not accessible")

    range_header = request.headers.get("range")

    headers = {
        "Accept-Ranges": "bytes",
        "Content-Length": str(file_size),
        "Content-Type": content_type,
    }

    if range_header:
        range_str = range_header.replace("bytes=", "").split("-")
        start = int(range_str[0]) if range_str[0] else 0
        end = int(range_str[1]) if len(range_str) > 1 and range_str[1] else file_size - 1
        end = min(end, file_size - 1)
        length = end - start + 1
        
        headers["Content-Length"] = str(length)
        headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"

        def file_iterator():
            with open(file_path, "rb") as f:
                f.seek(start)
                bytes_to_read = length
                while bytes_to_read > 0:
                    chunk_size = min(1024 * 1024, bytes_to_read) # 1MB chunk
                    data = f.read(chunk_size)
                    if not data:
                        break
                    bytes_to_read -= len(data)
                    yield data

        return StreamingResponse(file_iterator(), status_code=206, headers=headers)
    else:
        def file_iterator():
            with open(file_path, "rb") as f:
                while True:
                    data = f.read(1024 * 1024)
                    if not data:
                        break
                    yield data
        return StreamingResponse(file_iterator(), status_code=200, headers=headers)


@router.get("/video/{upload_task_id}")
def stream_video(upload_task_id: str, request: Request, db: Session = Depends(get_db)):
    """
    Streams the video file for a given UploadTask.
    """
    task = db.query(UploadTask).filter(UploadTask.id == upload_task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="UploadTask not found")

    video_path = task.video_path
    if not video_path or not os.path.isfile(video_path):
        raise HTTPException(status_code=404, detail="Video file not found")

    mime_type, _ = mimetypes.guess_type(video_path)
    if not mime_type:
        mime_type = "video/mp4"

    return _range_requests_response(request, video_path, mime_type)


@router.get("/thumbnail/{upload_task_id}")
def serve_thumbnail(upload_task_id: str, db: Session = Depends(get_db)):
    """
    Serves the thumbnail image for a given UploadTask.
    If not available, falls back to a default placeholder.
    """
    task = db.query(UploadTask).filter(UploadTask.id == upload_task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="UploadTask not found")

    thumbnail_path = task.thumbnail_path
    if thumbnail_path and os.path.isfile(thumbnail_path):
        mime_type, _ = mimetypes.guess_type(thumbnail_path)
        return FileResponse(thumbnail_path, media_type=mime_type or "image/jpeg")

    # Fallback to placeholder if missing
    # We will return 404 and let the frontend handle the fallback UI,
    # OR return a transparent 1x1 image, but the requirements said:
    # "Jika thumbnail tidak tersedia, kembalikan placeholder yang sudah ada. Jangan error."
    # Let's see if there is a placeholder in backend/assets/placeholder.jpg
    # Since I don't know where it is, it's safer to return a 404 or a transparent pixel
    # Actually, the user says "kembalikan placeholder yang sudah ada". Wait, the frontend code has a placeholder UI when thumbnailUrl is null.
    # Oh, wait: "Jika thumbnail tidak tersedia, kembalikan placeholder yang sudah ada. Jangan error."
    # Let's just return a default placeholder. Does `backend/thumbnails/placeholder.jpg` exist?
    
    # Check if a placeholder exists
    placeholder_path = os.path.join(os.path.dirname(__file__), "..", "thumbnails", "placeholder.jpg")
    if os.path.exists(placeholder_path):
        return FileResponse(placeholder_path, media_type="image/jpeg")
        
    # If not, generate a 1x1 transparent PNG on the fly to avoid 404 error
    transparent_pixel = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
    return Response(content=transparent_pixel, media_type="image/png")


@router.post("/upload-thumbnail/{upload_task_id}")
async def upload_thumbnail(upload_task_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload a custom thumbnail for an UploadTask.
    Supported formats: jpg, jpeg, png, webp, jfif.
    Automatically trims baked-in black bars and fits to 16:9 (1280x720) YouTube standard.
    """
    task = db.query(UploadTask).filter(UploadTask.id == upload_task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="UploadTask not found")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".jpg", ".jpeg", ".png", ".webp", ".jfif"]:
        raise HTTPException(status_code=400, detail=f"Unsupported file format: {ext}")

    content = await file.read()

    # Ensure thumbnails directory exists
    from services.system.path_service import PathService
    from services.media.thumbnail_processor import fit_thumbnail_to_16_9

    thumbnails_dir = os.path.join(PathService.get_temp_dir(), "thumbnails")
    os.makedirs(thumbnails_dir, exist_ok=True)

    # Save processed 16:9 thumbnail securely
    safe_filename = f"thumb_{upload_task_id}.jpg"
    dest_path = os.path.join(thumbnails_dir, safe_filename)

    try:
        fit_thumbnail_to_16_9(content, output_path=dest_path)
    except Exception as e:
        with open(dest_path, "wb") as buffer:
            buffer.write(content)

    # Update database
    task.thumbnail_path = dest_path
    db.commit()

    return {"success": True, "data": {"thumbnail_path": dest_path}}


def open_save_file_picker(default_name: str, ext: str) -> str | None:
    """
    Opens OS native Save File Dialog (Explorer on Windows, Finder on macOS).
    """
    import sys
    import subprocess
    import re
    
    clean_ext = ext if ext.startswith(".") else f".{ext}"
    clean_name = re.sub(r'[\\/*?:"<>|]', "_", default_name)
    if not clean_name.lower().endswith(clean_ext.lower()):
        clean_name = f"{clean_name}{clean_ext}"

    try:
        if sys.platform == "win32":
            ps_script = f'''
            Add-Type -AssemblyName System.Windows.Forms
            $dlg = New-Object System.Windows.Forms.SaveFileDialog
            $dlg.Title = "Save Thumbnail"
            $dlg.FileName = "{clean_name}"
            $dlg.Filter = "Image Files (*{clean_ext})|*{clean_ext}|All Files (*.*)|*.*"
            $dlg.DefaultExt = "{clean_ext.lstrip('.')}"
            $dlg.AddExtension = $true
            $dlg.RestoreDirectory = $true
            if ($dlg.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {{
                [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
                Write-Output $dlg.FileName
            }}
            '''
            startupinfo = subprocess.STARTUPINFO()
            startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            startupinfo.wShowWindow = 0
            
            cmd = ["powershell", "-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", ps_script]
            out = subprocess.check_output(cmd, startupinfo=startupinfo, timeout=120)
            chosen_path = out.decode("utf-8", errors="ignore").strip()
            if chosen_path:
                return os.path.normpath(chosen_path)
        elif sys.platform == "darwin":
            osa = f'''
            set chosenFile to choose file name with prompt "Save Thumbnail" default name "{clean_name}"
            POSIX path of chosenFile
            '''
            out = subprocess.check_output(["osascript", "-e", osa], timeout=120)
            chosen_path = out.decode("utf-8", errors="ignore").strip()
            if chosen_path:
                return os.path.normpath(chosen_path)
        else:
            import tkinter as tk
            from tkinter import filedialog
            root = tk.Tk()
            root.withdraw()
            root.attributes('-topmost', True)
            chosen_path = filedialog.asksaveasfilename(title="Save Thumbnail", initialfile=clean_name, defaultextension=clean_ext)
            root.destroy()
            if chosen_path:
                return os.path.normpath(chosen_path)
    except Exception as e:
        print(f"Save dialog error: {e}")
        
    return None


@router.post("/save-thumbnail-dialog/{upload_task_id}")
def save_thumbnail_dialog(upload_task_id: str, db: Session = Depends(get_db)):
    """
    Triggers OS Explorer Save Dialog and copies the thumbnail to the chosen location.
    """
    task = db.query(UploadTask).filter(UploadTask.id == upload_task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="UploadTask not found")

    src_path = None
    if task.thumbnail_path and os.path.isfile(task.thumbnail_path):
        src_path = task.thumbnail_path
    
    if not src_path:
        placeholder_path = os.path.join(os.path.dirname(__file__), "..", "thumbnails", "placeholder.jpg")
        if os.path.exists(placeholder_path):
            src_path = placeholder_path

    if not src_path:
        raise HTTPException(status_code=404, detail="No thumbnail available to save")

    ext = os.path.splitext(src_path)[1] or ".jpg"
    safe_title = (task.title or "thumbnail").strip()
    
    chosen_path = open_save_file_picker(f"{safe_title}_thumbnail{ext}", ext)
    if not chosen_path:
        return {"success": False, "cancelled": True, "message": "Save cancelled by user"}

    try:
        os.makedirs(os.path.dirname(chosen_path), exist_ok=True)
        shutil.copyfile(src_path, chosen_path)
        return {"success": True, "cancelled": False, "data": {"saved_path": chosen_path}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

