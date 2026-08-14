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

@router.get("/health/{channel_id}")
def get_account_health(channel_id: str, db: Session = Depends(get_db)):
    return WatchFolderService.get_account_health(db, channel_id)

from pydantic import BaseModel

class ScanNowRequest(BaseModel):
    channel_id: Optional[str] = None
    pipeline_type: Optional[str] = None

@router.post("/scan")
@router.post("/scan-now")
def trigger_scan_now(
    body: Optional[ScanNowRequest] = None,
    channel_id: Optional[str] = None,
    pipeline_type: Optional[str] = None
):
    cid = (body.channel_id if body and body.channel_id else channel_id) or None
    ptype = (body.pipeline_type if body and body.pipeline_type else pipeline_type) or None
    return WatchFolderService.trigger_scan_now(channel_id=cid, pipeline_type=ptype)

class DiagnoseRequest(BaseModel):
    channel_id: Optional[str] = None

@router.post("/diagnose")
def diagnose_folder(body: Optional[DiagnoseRequest] = None, channel_id: Optional[str] = None, db: Session = Depends(get_db)):
    cid = (body.channel_id if body and body.channel_id else channel_id) or None
    return WatchFolderService.diagnose_folder(db, channel_id=cid)

@router.post("/force-ingest")
def force_ingest(body: Optional[DiagnoseRequest] = None, channel_id: Optional[str] = None, db: Session = Depends(get_db)):
    cid = (body.channel_id if body and body.channel_id else channel_id) or None
    return WatchFolderService.force_ingest(db, channel_id=cid)

