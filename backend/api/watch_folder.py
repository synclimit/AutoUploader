import logging
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.db import get_db

from services.watch_folder_service import WatchFolderService

logger = logging.getLogger("watch_folder.api")

router = APIRouter(prefix="/api/v1/watch-folder", tags=["Watch Folder"])

@router.get("/health")
def get_all_health(db: Session = Depends(get_db)):
    return WatchFolderService.get_all_health(db)

@router.get("/health/{account_id}")
def get_account_health(account_id: str, db: Session = Depends(get_db)):
    return WatchFolderService.get_account_health(db, account_id)

@router.post("/scan")
def trigger_scan_now(account_id: Optional[str] = None, pipeline_type: Optional[str] = None):
    return WatchFolderService.trigger_scan_now(account_id=account_id, pipeline_type=pipeline_type)

