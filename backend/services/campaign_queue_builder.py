import uuid
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

from sqlalchemy.orm import Session
import pytz

from models import CampaignReviewSession, CampaignReviewAsset, CampaignAsset, CampaignUploadPlan, Channel

class CampaignQueueBuilder:

    @staticmethod
    def _parse_pipeline_config(channel: Channel, pipeline_type: str) -> Dict[str, Any]:
        try:
            pipelines = json.loads(channel.pipelines)
        except Exception:
            pipelines = {}
            
        pipeline_config = pipelines.get(pipeline_type, {})
        
        # Resolve config mapping
        daily_limit = pipeline_config.get("daily_limit", 1)
        schedule = pipeline_config.get("schedule", ["09:00"])
        humanize = pipeline_config.get("humanize", {"enabled": False, "min_delay_minutes": 0, "max_delay_minutes": 0})
        timezone_str = channel.publish_timezone or "UTC"
        
        return {
            "daily_limit": daily_limit,
            "schedule": schedule,
            "humanize": humanize,
            "timezone": timezone_str
        }

    @staticmethod
    def build_queue(db: Session, session_id: str, channel_id: str, pipeline_type: str, rebuild: bool = False) -> List[CampaignUploadPlan]:
        # 1. Fetch Session and Verify LOCKED status
        session = db.query(CampaignReviewSession).filter(
            CampaignReviewSession.id == session_id,
            CampaignReviewSession.channel_id == channel_id,
            CampaignReviewSession.pipeline_type == pipeline_type
        ).first()

        if not session:
            raise ValueError(f"Review session {session_id} not found.")

        if session.status != "LOCKED":
            raise ValueError(f"Review session must be LOCKED to build a queue. Current status: {session.status}")

        # 2. Check Idempotency
        existing_plans = db.query(CampaignUploadPlan).filter(
            CampaignUploadPlan.review_session_id == session_id
        ).order_by(CampaignUploadPlan.publish_order).all()

        if existing_plans and not rebuild:
            return existing_plans
            
        if existing_plans and rebuild:
            from models import CampaignExecutionState
            for plan in existing_plans:
                if plan.execution_status not in [CampaignExecutionState.PLANNED, CampaignExecutionState.READY]:
                    raise ValueError("Cannot rebuild queue because some plans have already been dispatched or processed.")
            for plan in existing_plans:
                db.delete(plan)
            db.flush()

        # 3. Read Selected Assets
        selected_assets = [a for a in session.assets if a.selected]
        if not selected_assets:
            raise ValueError("No assets selected in the review session.")

        # 4. Read Configuration
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        if not channel:
            raise ValueError("Channel channel not found.")

        config = CampaignQueueBuilder._parse_pipeline_config(channel, pipeline_type)
        
        daily_limit = config["daily_limit"]
        schedule = config["schedule"]
        humanize = config["humanize"]
        timezone_str = config["timezone"]
        
        if not daily_limit or daily_limit <= 0:
            raise ValueError("Invalid daily_limit configuration.")
        if not schedule:
            raise ValueError("Publish schedule is empty.")
        if daily_limit > len(schedule):
            raise ValueError(f"daily_limit ({daily_limit}) cannot be greater than the number of times in schedule ({len(schedule)}). Please provide more scheduled times to avoid simultaneous uploads.")

        try:
            tz = pytz.timezone(timezone_str)
        except pytz.UnknownTimeZoneError:
            tz = pytz.UTC

        # We start scheduling from today relative to the configured timezone
        now_utc = datetime.utcnow()
        now_tz = now_utc.replace(tzinfo=pytz.UTC).astimezone(tz)
        
        plans_to_create = []
        
        # Load physical CampaignAssets corresponding to selected fingerprints
        fingerprints = [a.fingerprint for a in selected_assets]
        physical_assets = db.query(CampaignAsset).filter(CampaignAsset.fingerprint.in_(fingerprints)).all()
        fingerprint_to_physical_id = {pa.fingerprint: pa.id for pa in physical_assets}
        
        missing = [a for a in selected_assets if a.fingerprint not in fingerprint_to_physical_id]
        if missing:
            from services.campaign_asset_service import CampaignAssetService
            for review_asset in missing:
                asset_data = {
                    "channel_id": channel_id,
                    "campaign_id": session_id,
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
                new_physical = CampaignAssetService.create_asset(db, asset_data)
                fingerprint_to_physical_id[new_physical.fingerprint] = new_physical.id

        # Generate valid slots in the future
        slots = []
        current_date = now_tz.date()
        sorted_schedule = sorted(schedule)
        
        while len(slots) < len(selected_assets):
            slots_added_today = 0
            for time_str in sorted_schedule:
                if slots_added_today >= daily_limit:
                    break
                if len(slots) >= len(selected_assets):
                    break
                    
                try:
                    hour, minute = map(int, time_str.split(':'))
                except ValueError:
                    raise ValueError(f"Invalid time format in schedule: {time_str}")
                    
                naive_dt = datetime.combine(current_date, datetime.min.time()) + timedelta(hours=hour, minutes=minute)
                try:
                    localized_dt = tz.localize(naive_dt, is_dst=None)
                except (pytz.AmbiguousTimeError, pytz.NonExistentTimeError):
                    localized_dt = tz.localize(naive_dt, is_dst=False)
                
                # Check if it's in the future (with a small 5 minute buffer)
                if localized_dt > now_tz + timedelta(minutes=5):
                    slots.append((current_date, time_str, localized_dt))
                    slots_added_today += 1
                    
            current_date += timedelta(days=1)

        for order, asset in enumerate(selected_assets):
            publish_date, time_str, localized_dt = slots[order]
            utc_dt = localized_dt.astimezone(pytz.UTC).replace(tzinfo=None) # Store as naive UTC
            
            # Apply Humanize
            humanized_utc_dt = utc_dt
            if humanize.get("enabled"):
                min_delay = humanize.get("min_delay_minutes", 0)
                max_delay = humanize.get("max_delay_minutes", 0)
                if max_delay >= min_delay and max_delay > 0:
                    delay_minutes = random.randint(min_delay, max_delay)
                    humanized_utc_dt = utc_dt + timedelta(minutes=delay_minutes)
                    
                    # Humanized datetime handles random delay, do not overwrite utc_dt
                    pass
            
            # Validate duplicate datetimes inside the same batch (unlikely but safe to check)
            # Or if humanized goes beyond the day boundary (e.g. into the next day), clamp it.
            # However, for simplicity, we assume humanize is small (e.g. 0-60 mins).
            
            plan = CampaignUploadPlan(
                id=str(uuid.uuid4()),
                review_session_id=session_id,
                campaign_asset_id=fingerprint_to_physical_id[asset.fingerprint],
                channel_id=channel_id,
                pipeline_type=pipeline_type,
                publish_order=order,
                publish_date=publish_date.strftime("%Y-%m-%d"),
                publish_time=time_str,
                publish_datetime=utc_dt,
                humanized_datetime=humanized_utc_dt,
                title=asset.title,
                description=asset.description,
                tags=asset.tags,
                thumbnail=asset.thumbnail,
                playlist=asset.playlist,
                category=asset.category,
                visibility=asset.visibility,
                language=asset.language,
                audience=asset.audience,
                recording_date=asset.recording_date,
                status="PLANNED"
            )
            plans_to_create.append(plan)
            
        db.add_all(plans_to_create)
        db.commit()
        
        for plan in plans_to_create:
            db.refresh(plan)
            
        return plans_to_create

    @staticmethod
    def get_plans_for_session(db: Session, session_id: str) -> List[CampaignUploadPlan]:
        return db.query(CampaignUploadPlan).filter(
            CampaignUploadPlan.review_session_id == session_id
        ).order_by(CampaignUploadPlan.publish_order).all()
