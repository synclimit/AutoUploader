import logging
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from models import Channel
from services.watch_folder import health_service
from services.watch_folder.engine import get_engine

logger = logging.getLogger("watch_folder.service")

class WatchFolderService:
    @staticmethod
    def get_all_health(db: Session):
        try:
            channels = (
                db.query(Channel)
                .filter(
                    or_(
                        Channel.pipelines != "{}",
                        Channel.watch_folder_enabled == True
                    )
                )
                .all()
            )
        except Exception as e:
            logger.error(f"[SERVICE] DB error fetching channels: {e}")
            raise HTTPException(status_code=500, detail="Database error")

        if not channels:
            return {"channels": [], "total": 0}

        health_records = health_service.get_all_health(
            [a.id for a in channels], db
        )

        account_map = {a.id: a for a in channels}
        for record in health_records:
            acc = account_map.get(record["channel_id"])
            if acc:
                record["channel_name"] = acc.channel_name
                import json
                try:
                    pipelines = json.loads(acc.pipelines) if acc.pipelines else {}
                    pipeline_states = json.loads(acc.pipeline_states) if acc.pipeline_states else {}
                except:
                    pipelines = {}
                    pipeline_states = {}
                    
                for p_key, p_health in record.get("pipelines", {}).items():
                    p_config = pipelines.get(p_key, {})
                    p_state = pipeline_states.get(p_key, {})
                    p_health["daily_limit"] = p_config.get("daily_limit", "—")
                    p_health["today_intake"] = p_state.get("today_intake", 0)
                    p_health["remaining_today"] = max(0, int(p_health["daily_limit"]) - p_health["today_intake"]) if str(p_health["daily_limit"]).isdigit() else "—"
                    p_health["packages_found"] = p_health.get("last_scan_count", "—")

        return {"channels": health_records, "total": len(health_records)}

    @staticmethod
    def get_account_health(db: Session, channel_id: str):
        try:
            channel = (
                db.query(Channel)
                .filter(Channel.id == channel_id)
                .first()
            )
        except Exception as e:
            logger.error(f"[SERVICE] DB error: {e}")
            raise HTTPException(status_code=500, detail="Database error")

        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")

        health = health_service.get_health(channel_id, db)
        health["channel_name"] = channel.channel_name
        
        import json
        try:
            pipelines = json.loads(channel.pipelines) if channel.pipelines else {}
            pipeline_states = json.loads(channel.pipeline_states) if channel.pipeline_states else {}
        except:
            pipelines = {}
            pipeline_states = {}
            
        for p_key, p_health in health.get("pipelines", {}).items():
            p_config = pipelines.get(p_key, {})
            p_state = pipeline_states.get(p_key, {})
            p_health["daily_limit"] = p_config.get("daily_limit", "—")
            p_health["today_intake"] = p_state.get("today_intake", 0)
            p_health["remaining_today"] = max(0, int(p_health["daily_limit"]) - p_health["today_intake"]) if str(p_health["daily_limit"]).isdigit() else "—"
            p_health["packages_found"] = p_health.get("last_scan_count", "—")

        return health

    @staticmethod
    def trigger_scan_now(channel_id: Optional[str] = None, pipeline_type: Optional[str] = None):
        engine = get_engine()
        summary = engine.scan_now(channel_id=channel_id, pipeline_type=pipeline_type)

        return {
            "success": summary.success,
            "accounts_scanned": summary.accounts_scanned,
            "packages_found": summary.packages_found,
            "tasks_created": summary.tasks_created,
            "duplicates_skipped": summary.duplicates_skipped,
            "validation_errors": summary.validation_errors,
        }
