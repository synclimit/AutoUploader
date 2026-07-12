import os
import uuid
import shutil
import logging
from typing import List
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException
from sqlalchemy.orm import Session
from database.db import get_db
from models import Channel
from services.watch_folder.engine import get_engine

logger = logging.getLogger("import_api")
router = APIRouter(prefix="/api/v1/import", tags=["Import"])

from services.system.path_service import PathService
UPLOAD_DIR = os.path.join(PathService.get_temp_dir(), "uploads")

@router.post("/upload")
async def upload_files(
    channel_id: str = Form(...),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    import_batch_id = f"import_{uuid.uuid4().hex[:8]}"
    batch_dir = os.path.join(UPLOAD_DIR, import_batch_id)
    os.makedirs(batch_dir, exist_ok=True)

    logger.info(f"Received {len(files)} files for import batch {import_batch_id}")

    paths = []
    # If the user drags a folder, filename might be "FolderName/video.mp4".
    # In FastAPI, we can access filename. We need to preserve the relative structure.
    for file in files:
        # Prevent path traversal
        safe_name = file.filename.replace("..", "").lstrip("/")
        
        # If it's just files at the root (no folder), create a separate package for each video
        if "/" not in safe_name and "\\" not in safe_name:
            ext = os.path.splitext(safe_name)[1].lower()
            if ext in [".mp4", ".mov", ".mkv"]:
                basename = os.path.splitext(safe_name)[0]
                safe_name = os.path.join(basename, "video.mp4")
            else:
                safe_name = os.path.join("package", safe_name)
            
        file_path = os.path.join(batch_dir, safe_name)
        
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
    from services.watch_folder import validator, duplicate_checker, importer
    
    # We find all immediate subdirectories in the batch directory
    # and process them directly using validator and importer
    imported_count = 0
    duplicate_count = 0
    error_count = 0
    
    folders_to_process = [f.path for f in os.scandir(batch_dir) if f.is_dir()]
    
    import json
    for folder_path in folders_to_process:
        metadata_path = os.path.join(folder_path, "metadata.json")
        if not os.path.exists(metadata_path):
            videos = [f for f in os.listdir(folder_path) if f.endswith((".mp4", ".mov", ".mkv"))]
            if videos:
                title = os.path.basename(folder_path)
                video_id = f"RAW_{uuid.uuid4().hex[:12]}"
                with open(metadata_path, "w") as f:
                    json.dump({
                        "title_final": title, 
                        "video_id": video_id,
                        "description": "", 
                        "tags": []
                    }, f)
                    
        result = validator.validate(folder_path)
        if not result.success:
            error_count += 1
            continue
            
        dup_result = duplicate_checker.check(
            video_id=result.video_id,
            package_folder=folder_path,
            db=db,
        )
        
        if dup_result.is_duplicate:
            duplicate_count += 1
            continue
            
        try:
            # Note: For drag & drop import, we use a generic 'import' pipeline key and config
            # since it is not coming from a configured watch folder pipeline.
            p_config = {
                "processing_order": "oldest_first",
                "schedule_mode": "manual",
                "retry_failed": True,
                "duplicate_policy": "skip"
            }
            task = importer.create_task(result, channel, db, "manual_import", p_config)
            imported_count += 1
        except Exception as e:
            logger.error(f"[IMPORT_API] Import failed | folder={folder_path!r} | error={e}")
            error_count += 1
            
    return {
        "message": "Import finished",
        "imported": imported_count,
        "duplicates": duplicate_count,
        "errors": error_count,
        "batch_dir": batch_dir
    }
