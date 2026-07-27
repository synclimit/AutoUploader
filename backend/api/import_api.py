import os
import uuid
import logging
from typing import List
from fastapi import APIRouter, Form, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.db import get_db
from models import Channel
from services.watch_folder.engine import get_engine

logger = logging.getLogger("import_api")
router = APIRouter(prefix="/api/v1/import", tags=["Import"])

class ImportPathsRequest(BaseModel):
    channel_id: str
    paths: List[str]

@router.post("/upload", deprecated=True)
async def upload_files_deprecated():
    raise HTTPException(status_code=400, detail="HTML5 binary upload is deprecated in Zero Copy Architecture. Please use native PyWebView file picker and POST /paths.")

@router.post("/paths")
def import_from_paths(
    data: ImportPathsRequest,
    db: Session = Depends(get_db)
):
    channel = db.query(Channel).filter(Channel.id == data.channel_id).first()
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    logger.info(f"Received {len(data.paths)} paths for import")

    from services.watch_folder import validator, duplicate_checker, importer

    imported_count = 0
    duplicate_count = 0
    error_count = 0

    # Expand directories into video files or package folders
    paths_to_process = []
    for path in data.paths:
        if os.path.isdir(path):
            # Check if this is a Package Folder (e.g. from MediaFactory)
            if os.path.exists(os.path.join(path, "metadata.json")):
                paths_to_process.append(path)
            else:
                # Scan as a Batch Folder for videos
                try:
                    for f in os.listdir(path):
                        if f.lower().endswith((".mp4", ".mov", ".mkv", ".avi")):
                            paths_to_process.append(os.path.join(path, f))
                except OSError as e:
                    logger.error(f"[IMPORT_API] Error scanning directory {path}: {e}")
                    error_count += 1
        elif os.path.isfile(path):
            if path.lower().endswith((".mp4", ".mov", ".mkv", ".avi")):
                paths_to_process.append(path)
        else:
            logger.warning(f"[IMPORT_API] Path not found: {path}")
            error_count += 1

    for file_path in paths_to_process:
        result = validator.validate(file_path)
        if not result.success:
            logger.warning(f"[IMPORT_API] Validation failed for {file_path}: {result.error_message}")
            error_count += 1
            continue

        dup_result = duplicate_checker.check(
            video_id=result.video_id,
            package_folder=result.package_folder,
            db=db,
        )
        
        if dup_result.is_duplicate:
            logger.info(f"[IMPORT_API] Duplicate skipped: {file_path}")
            duplicate_count += 1
            continue
            
        try:
            p_config = {
                "processing_order": "oldest_first",
                "schedule_mode": "manual",
                "retry_failed": True,
                "duplicate_policy": "skip"
            }
            task = importer.create_task(result, channel, db, "manual_import", p_config)
            imported_count += 1
        except Exception as e:
            logger.error(f"[IMPORT_API] Import failed | file={file_path!r} | error={e}")
            error_count += 1
            
    return {
        "message": "Import finished",
        "imported": imported_count,
        "duplicates": duplicate_count,
        "errors": error_count,
    }

