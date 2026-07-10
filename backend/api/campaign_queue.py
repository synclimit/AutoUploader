from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database.db import get_db
from schemas import CampaignQueueBuildRequest, CampaignUploadPlanResponse, APIResponse
from services.campaign_queue_builder import CampaignQueueBuilder

router = APIRouter(prefix="/api/v1/campaign-queue", tags=["Campaign Queue Builder"])

@router.post("/build", response_model=APIResponse[List[CampaignUploadPlanResponse]])
def build_campaign_queue(
    request: CampaignQueueBuildRequest,
    rebuild: bool = False,
    db: Session = Depends(get_db)
):
    """
    Builds the deterministic CampaignUploadPlan snapshot for a LOCKED review session.
    Idempotent by default, unless rebuild=True is passed.
    """
    try:
        plans = CampaignQueueBuilder.build_queue(
            db=db,
            session_id=request.session_id,
            channel_id=request.channel_id,
            pipeline_type=request.pipeline_type,
            rebuild=rebuild
        )
        return APIResponse(success=True, data=plans)
    except Exception as e:
        return APIResponse(success=False, error={"code": "QUEUE_BUILD_FAILED", "message": str(e)})

@router.get("/{session_id}", response_model=APIResponse[List[CampaignUploadPlanResponse]])
def get_campaign_queue(
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    Retrieves the generated CampaignUploadPlan for a given session.
    """
    try:
        plans = CampaignQueueBuilder.get_plans_for_session(db, session_id)
        return APIResponse(success=True, data=plans)
    except Exception as e:
        return APIResponse(success=False, error={"code": "QUEUE_FETCH_FAILED", "message": str(e)})
