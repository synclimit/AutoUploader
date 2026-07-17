from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta
import uuid

from models import CampaignReviewSession, CampaignReviewAsset
from schemas import CampaignScanResponse, CampaignReviewAssetUpdate
from services.campaign_asset_service import CampaignAssetService

class CampaignReviewService:
    @staticmethod
    def get_session(db: Session, channel_id: str, pipeline_type: str) -> CampaignReviewSession:
        return db.query(CampaignReviewSession).filter(
            CampaignReviewSession.channel_id == channel_id,
            CampaignReviewSession.pipeline_type == pipeline_type
        ).order_by(CampaignReviewSession.created_at.desc()).first()

    @staticmethod
    def create_or_update_session(db: Session, channel_id: str, pipeline_type: str, scan_data: CampaignScanResponse) -> CampaignReviewSession:
        # Check if an active non-locked session exists for this channel and pipeline
        session = db.query(CampaignReviewSession).filter(
            CampaignReviewSession.channel_id == channel_id,
            CampaignReviewSession.pipeline_type == pipeline_type,
            CampaignReviewSession.status != "LOCKED"
        ).first()
        
        if not session:
            session = CampaignReviewSession(
                id=str(uuid.uuid4()),
                channel_id=channel_id,
                pipeline_type=pipeline_type,
                strategy="campaign",
                status="DRAFT",
                expires_at=datetime.utcnow() + timedelta(days=7)
            )
            db.add(session)
            db.flush()
        
        # We need to reconcile the assets from scan_data with existing assets in the session
        # If new assets appeared in scan_data, add them.
        # If existing assets are no longer in scan_data, we might leave them or mark them.
        # For simplicity, we can do a full sync since it's a review staging area.
        
        existing_assets = {a.fingerprint: a for a in session.assets}
        seen_fingerprints = set()
        
        for scan_asset in scan_data.assets:
            fp = scan_asset.fingerprint
            seen_fingerprints.add(fp)
            
            if fp in existing_assets:
                # Update status in case it changed (e.g. became CONSUMED)
                asset = existing_assets[fp]
                asset.status = scan_asset.status
                if asset.status != "NEW":
                    asset.selected = False
                    asset.editable = False
            else:
                new_asset = CampaignReviewAsset(
                    id=str(uuid.uuid4()),
                    session_id=session.id,
                    fingerprint=fp,
                    sha256=scan_asset.sha256,
                    filepath=scan_asset.filepath,
                    filename=scan_asset.filename,
                    filesize=scan_asset.filesize,
                    duration_seconds=scan_asset.duration_seconds,
                    status=scan_asset.status,
                    selected=False,
                    editable=True if scan_asset.status == "NEW" else False,
                    title=scan_asset.filename.rsplit('.', 1)[0] # Default title
                )
                db.add(new_asset)
                
        # Update assets that are no longer present in the physical scan
        for fp, asset in existing_assets.items():
            if fp not in seen_fingerprints:
                asset.status = "MISSING"
                asset.editable = False
                asset.selected = False
                
        db.commit()
        db.refresh(session)
        
        # Recalculate summary
        CampaignReviewService.recalculate_summary(db, session)
        
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def select_asset(db: Session, channel_id: str, pipeline_type: str, asset_id: str, selected: bool) -> CampaignReviewSession:
        session = CampaignReviewService.get_session(db, channel_id, pipeline_type)
        if not session or session.status == "LOCKED":
            raise ValueError("No active review session or session is locked.")
            
        asset = db.query(CampaignReviewAsset).filter(
            CampaignReviewAsset.id == asset_id,
            CampaignReviewAsset.session_id == session.id
        ).first()
        
        if not asset:
            raise ValueError("Asset not found in current session.")
            
        if selected and asset.status != "NEW":
            raise ValueError(f"Cannot select asset with status {asset.status}")
            
        asset.selected = selected
        if session.status == "DRAFT":
            session.status = "REVIEWING"
            
        CampaignReviewService.recalculate_summary(db, session)
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def update_asset_metadata(db: Session, channel_id: str, pipeline_type: str, asset_id: str, updates: CampaignReviewAssetUpdate) -> CampaignReviewSession:
        session = CampaignReviewService.get_session(db, channel_id, pipeline_type)
        if not session or session.status == "LOCKED":
            raise ValueError("No active review session or session is locked.")
            
        asset = db.query(CampaignReviewAsset).filter(
            CampaignReviewAsset.id == asset_id,
            CampaignReviewAsset.session_id == session.id
        ).first()
        
        if not asset:
            raise ValueError("Asset not found in current session.")
            
        if not asset.editable:
            raise ValueError("Asset is not editable.")
            
        update_data = updates.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(asset, key, value)
            
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def approve_session(db: Session, channel_id: str, pipeline_type: str) -> CampaignReviewSession:
        session = CampaignReviewService.get_session(db, channel_id, pipeline_type)
        if not session:
            raise ValueError("No review session found.")
            
        if session.status == "LOCKED":
            return session
            
        session.status = "LOCKED"
        
        # Promote selected CampaignReviewAssets into physical CampaignAssets if they don't exist
        for review_asset in session.assets:
            if review_asset.selected and review_asset.sha256:
                if not CampaignAssetService.exists(db, review_asset.fingerprint):
                    asset_data = {
                        "channel_id": channel_id,
                        "campaign_id": session.id,
                        "fingerprint": review_asset.fingerprint,
                        "sha256": review_asset.sha256,
                        "filepath": review_asset.filepath,
                        "filename": review_asset.filename,
                        "filesize": review_asset.filesize,
                        "duration_seconds": review_asset.duration_seconds,
                        "source_type": "CAMPAIGN",
                        "asset_origin": "CAMPAIGN_SCAN",
                        "status": "NEW"
                    }
                    CampaignAssetService.create_asset(db, asset_data)
        
        db.commit()
        db.refresh(session)
        return session

    @staticmethod
    def recalculate_summary(db: Session, session: CampaignReviewSession):
        detected = 0
        available = 0
        selected = 0
        duplicate = 0
        invalid = 0
        selected_size = 0.0
        selected_duration = 0.0
        
        for asset in session.assets:
            detected += 1
            if asset.status == "NEW":
                available += 1
            elif asset.status == "CONSUMED":
                duplicate += 1
            elif asset.status == "INVALID":
                invalid += 1
                
            if asset.selected:
                selected += 1
                selected_size += asset.filesize
                selected_duration += asset.duration_seconds
                
        session.detected = detected
        session.available = available
        session.selected = selected
        session.duplicate = duplicate
        session.invalid = invalid
        session.selected_file_size = selected_size
        session.selected_duration = selected_duration
