from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.db import get_db
from models import CampaignUploadPlan, CampaignUploadJournal
from schemas import CampaignExecutionStartRequest, CampaignExecutionRetryRequest, CampaignUploadPlanResponse
from services.campaign_execution_service import CampaignExecutionService

router = APIRouter(prefix="/api/v1/campaign-execution", tags=["Campaign Execution"])

@router.post("/start")
def start_campaign(request: CampaignExecutionStartRequest, db: Session = Depends(get_db)):
    try:
        started = CampaignExecutionService.start_campaign(
            db=db,
            session_id=request.session_id,
            channel_id=request.channel_id,
            pipeline_type=request.pipeline_type
        )
        return {"success": True, "started_count": started}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/retry/{plan_id}", response_model=CampaignUploadPlanResponse)
def retry_plan(plan_id: str, db: Session = Depends(get_db)):
    try:
        plan = CampaignExecutionService.retry_plan(db=db, plan_id=plan_id)
        return plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from services.journal.journal_service import get_paginated_journal
from services.journal.csv_exporter import export_journal_csv
from fastapi import Request

@router.get("/journal")
def get_journal_paginated(request: Request, db: Session = Depends(get_db)):
    try:
        params = dict(request.query_params)
        return get_paginated_journal(db=db, params=params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/journal/export")
def export_journal(request: Request, db: Session = Depends(get_db)):
    try:
        params = dict(request.query_params)
        return export_journal_csv(db=db, params=params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{session_id}", response_model=List[CampaignUploadPlanResponse])
def get_execution_progress(session_id: str, db: Session = Depends(get_db)):
    try:
        plans = db.query(CampaignUploadPlan).filter(
            CampaignUploadPlan.review_session_id == session_id
        ).order_by(CampaignUploadPlan.publish_order).all()
        return plans
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

