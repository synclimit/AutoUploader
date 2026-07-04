from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, status, Query
from typing import List, Optional
from datetime import datetime

from database.db import get_db
from schemas import UploadTaskCreate, UploadTaskUpdate, UploadTaskResponse, QueueStatusEnum, SourceTypeEnum
from services.upload_service import UploadService, ScheduleRequest, GenerateMetadataRequest, SEOValidationRequest

router = APIRouter(prefix="/api/v1/queue", tags=["Queue"])

@router.get("", response_model=List[UploadTaskResponse])
def get_queue(
    status: Optional[List[str]] = Query(default=None),
    source_type: Optional[SourceTypeEnum] = None,
    account_id: Optional[str] = None,
    profile_id: Optional[str] = None,
    keyword: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    tasks = UploadService.get_all(
        db, 
        status=status,
        source_type=source_type,
        account_id=account_id,
        profile_id=profile_id,
        keyword=keyword,
        date_from=date_from,
        date_to=date_to,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip, 
        limit=limit
    )
    return tasks

import os
from fastapi.responses import FileResponse
from fastapi import HTTPException

# Secure Base Directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.abspath(os.path.join(BASE_DIR, "uploads"))
THUMBNAIL_DIR = os.path.abspath(os.path.join(BASE_DIR, "thumbnails"))

@router.get("/serve")
def serve_file(path: str):
    # Reject path traversal
    if ".." in path or path.startswith("/"):
        raise HTTPException(status_code=400, detail="Invalid path")
        
    abs_path = os.path.abspath(path)
    
    # Must be inside UPLOAD_DIR or THUMBNAIL_DIR or test_assets
    is_upload = abs_path.startswith(UPLOAD_DIR)
    is_thumbnail = abs_path.startswith(THUMBNAIL_DIR)
    is_test = "test_assets" in abs_path
    
    if not (is_upload or is_thumbnail or is_test):
        raise HTTPException(status_code=403, detail="Access denied")
        
    if not os.path.exists(abs_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    return FileResponse(abs_path)


@router.get("/{task_id}", response_model=UploadTaskResponse)
def get_task(task_id: str, db: Session = Depends(get_db)):
    return UploadService.get_by_id(db, task_id)

@router.get("/{task_id}/logs")
def get_task_logs(task_id: str, db: Session = Depends(get_db)):
    return UploadService.get_task_logs(db, task_id)

@router.post("", response_model=UploadTaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(data: UploadTaskCreate, db: Session = Depends(get_db)):
    return UploadService.create(db, data)

@router.put("/{task_id}", response_model=UploadTaskResponse)
def update_task(task_id: str, data: UploadTaskUpdate, db: Session = Depends(get_db)):
    return UploadService.update(db, task_id, data)

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, db: Session = Depends(get_db)):
    UploadService.delete(db, task_id)
    return None

@router.post("/{task_id}/approve", response_model=UploadTaskResponse)
def approve_task(task_id: str, db: Session = Depends(get_db)):
    return UploadService.approve(db, task_id)

@router.post("/{task_id}/cancel", response_model=UploadTaskResponse)
def cancel_task(task_id: str, db: Session = Depends(get_db)):
    return UploadService.cancel(db, task_id)

@router.post("/{task_id}/retry", response_model=UploadTaskResponse)
def retry_task(task_id: str, db: Session = Depends(get_db)):
    return UploadService.retry(db, task_id)

@router.post("/{task_id}/schedule", response_model=UploadTaskResponse)
def schedule_task(task_id: str, body: ScheduleRequest, db: Session = Depends(get_db)):
    return UploadService.schedule(db, task_id, body)

@router.post("/{task_id}/generate-metadata")
async def generate_task_metadata(task_id: str, body: GenerateMetadataRequest, db: Session = Depends(get_db)):
    return await UploadService.generate_metadata(db, task_id, body)

@router.post("/{task_id}/validate-seo")
def validate_seo_endpoint(task_id: str, body: SEOValidationRequest, db: Session = Depends(get_db)):
    return UploadService.validate_seo(db, task_id, body)

from models import AIGenerationHistory

@router.get("/{task_id}/ai-history")
def get_task_ai_history(task_id: str, db: Session = Depends(get_db)):
    history = db.query(AIGenerationHistory).filter(AIGenerationHistory.task_id == task_id).order_by(AIGenerationHistory.version.desc()).all()
    return {"success": True, "data": history}

@router.get("/keywords/autocomplete")
def get_keyword_autocomplete(db: Session = Depends(get_db)):
    from sqlalchemy import desc
    # Get recent keywords used, unique
    recent_history = db.query(AIGenerationHistory.keyword).filter(AIGenerationHistory.keyword != None).group_by(AIGenerationHistory.keyword).order_by(desc(AIGenerationHistory.created_at)).limit(10).all()
    keywords = [row[0] for row in recent_history if row[0]]
    return {"success": True, "data": keywords}


