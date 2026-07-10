import uuid
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any

from sqlalchemy.orm import Session
import pytz

from models import CampaignReviewSession, CampaignReviewAsset, CampaignAsset, CampaignUploadPlan, Account

class CampaignQueueBuilder:

    @staticmethod
    def _parse_pipeline_config(account: Account, pipeline_type: str) -> Dict[str, Any]:
        try:
            pipelines = json.loads(account.pipelines)
        except Exception:
            pipelines = {}
            
        pipeline_config = pipelines.get(pipeline_type, {})
        
        # Resolve config mapping
        daily_limit = pipeline_config.get("daily_limit", 1)
        schedule = pipeline_config.get("schedule", ["09:00"])
        humanize = pipeline_config.get("humanize", {"enabled": False, "min_delay_minutes": 0, "max_delay_minutes": 0})
        timezone_str = account.publish_timezone or "UTC"
        
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
            for plan in existing_plans:
                db.delete(plan)
            db.flush()

        # 3. Read Selected Assets
        selected_assets = [a for a in session.assets if a.selected]
        if not selected_assets:
            raise ValueError("No assets selected in the review session.")

        # 4. Read Configuration
        account = db.query(Account).filter(Account.id == channel_id).first()
        if not account:
            raise ValueError("Channel account not found.")

        config = CampaignQueueBuilder._parse_pipeline_config(account, pipeline_type)
        
        daily_limit = config["daily_limit"]
        schedule = config["schedule"]
        humanize = config["humanize"]
        timezone_str = config["timezone"]
        
        if not daily_limit or daily_limit <= 0:
            raise ValueError("Invalid daily_limit configuration.")
        if not schedule:
            raise ValueError("Publish schedule is empty.")

        try:
            tz = pytz.timezone(timezone_str)
        except pytz.UnknownTimeZoneError:
            tz = pytz.UTC

        # We start scheduling from tomorrow relative to the configured timezone
        now_utc = datetime.utcnow()
        now_tz = now_utc.replace(tzinfo=pytz.UTC).astimezone(tz)
        
        # Start Date
        start_date = now_tz.date() + timedelta(days=1)
        
        plans_to_create = []
        
        # Load physical CampaignAssets corresponding to selected fingerprints
        fingerprints = [a.fingerprint for a in selected_assets]
        physical_assets = db.query(CampaignAsset).filter(CampaignAsset.fingerprint.in_(fingerprints)).all()
        fingerprint_to_physical_id = {pa.fingerprint: pa.id for pa in physical_assets}
        
        missing = [a.fingerprint for a in selected_assets if a.fingerprint not in fingerprint_to_physical_id]
        if missing:
            raise ValueError(f"Missing physical CampaignAsset records for fingerprints: {missing}")

        for order, asset in enumerate(selected_assets):
            day_offset = order // daily_limit
            slot_index = order % daily_limit
            
            # If daily_limit > length of schedule, loop schedule times
            time_str = schedule[slot_index % len(schedule)]
            
            publish_date = start_date + timedelta(days=day_offset)
            
            # Parse time_str (HH:MM)
            try:
                hour, minute = map(int, time_str.split(':'))
            except ValueError:
                raise ValueError(f"Invalid time format in schedule: {time_str}")
                
            # Construct Base Datetime
            naive_dt = datetime.combine(publish_date, datetime.min.time()) + timedelta(hours=hour, minutes=minute)
            localized_dt = tz.localize(naive_dt)
            utc_dt = localized_dt.astimezone(pytz.UTC).replace(tzinfo=None) # Store as naive UTC
            
            # Apply Humanize
            humanized_utc_dt = utc_dt
            if humanize.get("enabled"):
                min_delay = humanize.get("min_delay_minutes", 0)
                max_delay = humanize.get("max_delay_minutes", 0)
                if max_delay >= min_delay and max_delay > 0:
                    delay_minutes = random.randint(min_delay, max_delay)
                    humanized_utc_dt = utc_dt + timedelta(minutes=delay_minutes)
            
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
