from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.db import get_db
from schemas import CampaignScanRequest, CampaignScanResponse, APIResponse
from services.campaign_scan_service import CampaignScanService

router = APIRouter(prefix="/api/v1/campaign-scan", tags=["Campaign Scan"])

@router.post("", response_model=APIResponse[CampaignScanResponse])
def scan_campaign_folder(request: CampaignScanRequest, db: Session = Depends(get_db)):
    """
    Scans a given folder recursively to determine the campaign asset status
    for all valid video files. This endpoint is strictly read-only and 
    does not insert CampaignAssets into the database.
    """
    try:
        scan_result = CampaignScanService.scan_folder(db, request.campaign_folder)
        return APIResponse(success=True, data=scan_result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to run campaign scan: {str(e)}"
        )
