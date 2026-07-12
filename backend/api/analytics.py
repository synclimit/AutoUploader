from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from database.db import get_db
from models import UploadTask, UploadLog
from services.channel_service import ChannelService
from services.analytics.gateway import analytics_gateway
import os
import pickle
from services.system.path_service import PathService

router = APIRouter(
    prefix="/api/v1/analytics",
    tags=["analytics"],
)

TOKENS_DIR = os.path.join(PathService.get_appdata_dir(), "tokens")
ACCOUNTS_TOKEN_DIR = os.path.join(TOKENS_DIR, "channels")

def get_credentials(channel_id: str):
    token_path = os.path.join(ACCOUNTS_TOKEN_DIR, f"{channel_id}.pickle")
    if not os.path.exists(token_path):
        raise HTTPException(status_code=400, detail="OAuth credentials not found. Please re-authenticate.")
        
    try:
        with open(token_path, "rb") as token_file:
            credentials = pickle.load(token_file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"OAuth credentials invalid or corrupted. Please re-authenticate. ({str(e)})")
    return credentials

@router.get("/dashboard/{channel_id}")
async def get_dashboard(channel_id: str, force_refresh: bool = False, db: Session = Depends(get_db)):
    """Lightweight dashboard endpoint."""
    channel = ChannelService.get_by_id(db, channel_id)
    credentials = get_credentials(channel_id)
    
    try:
        metrics = await analytics_gateway.get_dashboard(channel_id, "youtube", credentials, force_refresh)
        return {"status": "success", "data": metrics}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/overview/{channel_id}")
async def get_overview(channel_id: str, force_refresh: bool = False, db: Session = Depends(get_db)):
    """Heavy analytics workspace endpoint."""
    channel = ChannelService.get_by_id(db, channel_id)
    credentials = get_credentials(channel_id)
    
    try:
        metrics = await analytics_gateway.get_overview(channel_id, "youtube", credentials, force_refresh)
        return {"status": "success", "data": metrics}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/charts/{channel_id}")
async def get_charts(channel_id: str, days: int = Query(28, ge=7, le=90), force_refresh: bool = False, db: Session = Depends(get_db)):
    """Time-series chart dataset."""
    channel = ChannelService.get_by_id(db, channel_id)
    credentials = get_credentials(channel_id)
    
    try:
        metrics = await analytics_gateway.get_charts(channel_id, "youtube", days, credentials, force_refresh)
        return {"status": "success", "data": metrics}
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

@router.get("/videos/{channel_id}")
async def get_videos(channel_id: str, page_token: Optional[str] = None, limit: int = Query(50, ge=1, le=100), db: Session = Depends(get_db)):
    """Cursor paginated video list."""
    channel = ChannelService.get_by_id(db, channel_id)
    credentials = get_credentials(channel_id)
    
    # We'll forward this to the Gateway when implemented, mock for now
    return {"status": "success", "data": {"items": [], "nextPageToken": None}}

@router.get("/operations/{channel_id}")
async def get_operations(channel_id: str, db: Session = Depends(get_db)):
    """Local SQLite Operations and System Health metrics."""
    channel = ChannelService.get_by_id(db, channel_id)
    
    # 1. Queue Items
    queue_count = db.query(UploadTask.id).filter(
        UploadTask.channel_id == channel_id,
        UploadTask.status.in_(["WATCHED", "QUEUED", "UPLOADING", "PROCESSING"])
    ).count()
    
    # 2. Upload Success Ratio
    completed_count = db.query(UploadTask.id).filter(
        UploadTask.channel_id == channel_id,
        UploadTask.status == "COMPLETED"
    ).count()
    failed_count = db.query(UploadTask.id).filter(
        UploadTask.channel_id == channel_id,
        UploadTask.status.in_(["FAILED", "ERROR"])
    ).count()
    
    total = completed_count + failed_count
    success_rate = (completed_count / total * 100) if total > 0 else 100.0
    
    # 3. Recent Activity (Logs)
    # We will get the latest logs from the DB for this channel's tasks
    recent_logs = db.query(
        UploadLog.created_at, UploadLog.status, UploadLog.message
    ).join(UploadTask).filter(
        UploadTask.channel_id == channel_id
    ).order_by(UploadLog.created_at.desc()).limit(5).all()
    
    logs_data = []
    from datetime import timezone
    for log in recent_logs:
        level = "INFO"
        if "success" in log.status.lower() or "completed" in log.status.lower():
            level = "PASS"
        elif "fail" in log.status.lower() or "error" in log.status.lower():
            level = "FAIL"
            
        local_time = log.created_at.replace(tzinfo=timezone.utc).astimezone()
        logs_data.append({
            "time": local_time.strftime("%H:%M"),
            "level": level,
            "module": log.status,
            "message": log.message
        })
        
    import json
    try:
        pipelines = json.loads(channel.pipelines) if channel.pipelines else {}
    except:
        pipelines = {}
        
    long_pipe = pipelines.get("long", {})
    shorts_pipe = pipelines.get("shorts", {})
    
    watch_folder_enabled = bool(long_pipe.get("watch_folder")) or bool(shorts_pipe.get("watch_folder"))
    
    # If the UI hasn't explicitly saved "enabled": False, we assume it's True if watch_folder exists
    long_en = long_pipe.get("enabled", True) if long_pipe.get("watch_folder") else False
    short_en = shorts_pipe.get("enabled", True) if shorts_pipe.get("watch_folder") else False
    publish_enabled = long_en or short_en

    # Dynamic Health Score
    base_score = 100
    if not publish_enabled: base_score -= 2
    if channel.authentication_status != "Connected": base_score -= 20
    if not watch_folder_enabled: base_score -= 2
    
    if failed_count > 0:
        base_score -= min((failed_count * 2), 15)
        
    for l in logs_data:
        if l["level"] == "FAIL": base_score -= 1
        
    health_score = max(min(base_score, 100), 0)
    
    # 4. System Health
    system_health = {
        "score": health_score,
        "automation": "Active" if publish_enabled else "Paused",
        "oauth": "Valid" if channel.authentication_status == "Connected" else "Invalid",
        "watch_folder": "Connected" if watch_folder_enabled else "Disabled",
        "scheduler": "Ready",
        "ai_engine": "Ready"
    }
    
    data = {
        "queue_items": queue_count,
        "upload_success": round(success_rate, 1),
        "recent_activity": logs_data,
        "system_health": system_health
    }
    
    return {"status": "success", "data": data}
