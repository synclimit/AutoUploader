from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database.db import get_db
from schemas import (
    CampaignAssetCheckRequest,
    CampaignAssetLookupResponse,
    CampaignAssetResponse,
    CampaignAssetCreate,
    APIResponse
)
from sqlalchemy.exc import IntegrityError
from services.campaign_asset_service import CampaignAssetService

router = APIRouter(prefix="/api/v1/campaign-assets", tags=["Campaign Assets"])

@router.post("/check", response_model=CampaignAssetLookupResponse)
def check_duplicate(request: CampaignAssetCheckRequest, db: Session = Depends(get_db)):
    """
    Checks if a campaign asset already exists based on sha256, filesize, and duration.
    """
    try:
        fingerprint = CampaignAssetService.build_fingerprint(
            sha256=request.sha256,
            filesize=request.filesize,
            duration_seconds=request.duration_seconds
        )
        
        asset = CampaignAssetService.find_by_fingerprint(db, fingerprint)
        
        return CampaignAssetLookupResponse(
            duplicate=asset is not None,
            fingerprint=fingerprint,
            status=asset.status if asset else None,
            asset=asset
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to check campaign asset: {str(e)}"
        )

@router.get("/{fingerprint}", response_model=APIResponse[CampaignAssetResponse])
def get_campaign_asset(fingerprint: str, db: Session = Depends(get_db)):
    """
    Retrieves a campaign asset by its fingerprint.
    """
    asset = CampaignAssetService.find_by_fingerprint(db, fingerprint)
    
    if not asset:
        return APIResponse(
            success=False,
            error={"code": "NOT_FOUND", "message": "Campaign asset not found"}
        )
        
    return APIResponse(
        success=True,
        data=asset
    )

@router.post("", response_model=APIResponse[CampaignAssetResponse])
def create_campaign_asset(request: CampaignAssetCreate, db: Session = Depends(get_db)):
    """
    Creates a new campaign asset.
    """
    try:
        fingerprint = CampaignAssetService.build_fingerprint(
            sha256=request.sha256,
            filesize=request.filesize,
            duration_seconds=request.duration_seconds
        )
        
        asset_data = request.dict()
        asset_data["fingerprint"] = fingerprint
        
        asset = CampaignAssetService.create_asset(db, asset_data)
        return APIResponse(success=True, data=asset)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Campaign asset already exists (duplicate fingerprint)."
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create campaign asset: {str(e)}"
        )
