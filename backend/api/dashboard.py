from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from datetime import datetime

from database.db import get_db
from models import UploadTask, Channel
from schemas import QueueStatusEnum
from services.upload_engine.engine import get_engine
from services.watch_folder.engine import get_engine as get_wf_engine

from core.response import success_response
from services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

@router.get("", response_model=dict, summary="Get dashboard statistics")
def get_dashboard(db: Session = Depends(get_db)):
    upload_engine = get_engine()
    wf_engine = get_wf_engine()
    
    # In a real app we might combine statuses or poll the engines here
    engine_state = upload_engine.get_health() if hasattr(upload_engine, "get_health") else {"status": "unknown"}
    
    data = DashboardService.get_dashboard_data(db, engine_state)
    return success_response(data)
