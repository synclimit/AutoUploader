from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.db import get_db
from schemas import (
    APIResponse, 
    CampaignScanResponse,
    CampaignReviewSessionResponse,
    CampaignReviewSelectRequest,
    CampaignReviewAssetUpdate,
    CampaignReviewApproveRequest
)
from services.campaign_review_service import CampaignReviewService

router = APIRouter(prefix="/api/v1/campaign-review", tags=["Campaign Review Engine"])

@router.post("", response_model=APIResponse[CampaignReviewSessionResponse])
def get_or_create_review_session(
    request: CampaignScanResponse,
    channel_id: str,
    pipeline_type: str,
    db: Session = Depends(get_db)
):
    """
    Takes a Campaign Scan Result and initializes/updates a Review Session.
    """
    try:
        session = CampaignReviewService.create_or_update_session(db, channel_id, pipeline_type, request)
        return APIResponse(success=True, data=session)
    except Exception as e:
        return APIResponse(success=False, error={"code": "REVIEW_CREATE_FAILED", "message": str(e)})

@router.get("/{channel_id}/{pipeline_type}", response_model=APIResponse[CampaignReviewSessionResponse])
def get_review_session(
    channel_id: str,
    pipeline_type: str,
    db: Session = Depends(get_db)
):
    try:
        session = CampaignReviewService.get_session(db, channel_id, pipeline_type)
        if not session:
            return APIResponse(success=True, data=None)
        return APIResponse(success=True, data=session)
    except Exception as e:
        return APIResponse(success=False, error={"code": "REVIEW_GET_FAILED", "message": str(e)})

@router.post("/select", response_model=APIResponse[CampaignReviewSessionResponse])
def select_asset(
    request: CampaignReviewSelectRequest,
    db: Session = Depends(get_db)
):
    try:
        session = CampaignReviewService.select_asset(db, request.channel_id, request.pipeline_type, request.asset_id, request.selected)
        return APIResponse(success=True, data=session)
    except Exception as e:
        return APIResponse(success=False, error={"code": "REVIEW_SELECT_FAILED", "message": str(e)})

@router.post("/update/{asset_id}", response_model=APIResponse[CampaignReviewSessionResponse])
def update_metadata(
    asset_id: str,
    channel_id: str,
    pipeline_type: str,
    updates: CampaignReviewAssetUpdate,
    db: Session = Depends(get_db)
):
    try:
        session = CampaignReviewService.update_asset_metadata(db, channel_id, pipeline_type, asset_id, updates)
        return APIResponse(success=True, data=session)
    except Exception as e:
        return APIResponse(success=False, error={"code": "REVIEW_UPDATE_FAILED", "message": str(e)})

@router.post("/approve", response_model=APIResponse[CampaignReviewSessionResponse])
def approve_campaign(
    request: CampaignReviewApproveRequest,
    db: Session = Depends(get_db)
):
    try:
        session = CampaignReviewService.approve_session(db, request.channel_id, request.pipeline_type)
        return APIResponse(success=True, data=session)
    except Exception as e:
        return APIResponse(success=False, error={"code": "REVIEW_APPROVE_FAILED", "message": str(e)})
