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

    @staticmethod
    def diagnose_folder(db: Session, channel_id: Optional[str] = None):
        import os, json
        from models import Channel, UploadTask, IgnoredVideo
        from services.watch_folder import scanner, validator, duplicate_checker

        channels = db.query(Channel).all()
        if channel_id:
            channels = [c for c in channels if c.id == channel_id]

        if not channels:
            return {"success": False, "message": "No channels found for diagnosis."}

        reports = []
        for ch in channels:
            ch_report = {
                "channel_id": ch.id,
                "channel_name": ch.channel_name,
                "pipelines_raw": ch.pipelines,
                "watch_folder": ch.watch_folder,
                "pipelines_status": [],
                "items_found": [],
                "summary": {
                    "total_files_detected": 0,
                    "ingestible_videos": 0,
                    "skipped_reasons": {}
                }
            }

            pipelines = {}
            try:
                pipelines = json.loads(ch.pipelines) if ch.pipelines else {}
            except Exception:
                pipelines = {}

            if not pipelines and ch.watch_folder:
                pipelines = {"long": {"enabled": True, "watch_folder": ch.watch_folder}}

            for p_key in ["long", "shorts"]:
                p_cfg = pipelines.get(p_key, {})
                enabled = p_cfg.get("enabled", True if p_key == "long" and ch.watch_folder else False)
                wf = p_cfg.get("watch_folder") or p_cfg.get("campaign_folder") or (ch.watch_folder if p_key == "long" else None)

                pipe_info = {
                    "pipeline_type": p_key,
                    "enabled": enabled,
                    "watch_folder": wf,
                    "folder_exists": os.path.exists(wf) if wf else False,
                    "status_text": "OK" if enabled and wf and os.path.exists(wf) else ("FOLDER_NOT_FOUND" if wf and not os.path.exists(wf) else "DISABLED")
                }
                ch_report["pipelines_status"].append(pipe_info)

                if wf and os.path.exists(wf):
                    candidates, path_ok = scanner.scan(wf)
                    ch_report["summary"]["total_files_detected"] += len(candidates)

                    for c in candidates:
                        f_path = c.get("path") if isinstance(c, dict) else c
                        f_name = os.path.basename(f_path)

                        item_diag = {
                            "pipeline_type": p_key,
                            "file_path": f_path,
                            "file_name": f_name,
                            "status": "READY",
                            "reason": "Ready for ingestion"
                        }

                        if not enabled:
                            item_diag["status"] = "SKIPPED"
                            item_diag["reason"] = f"Pipeline '{p_key}' is turned OFF in Channel Settings"
                            ch_report["summary"]["skipped_reasons"]["PIPELINE_DISABLED"] = ch_report["summary"]["skipped_reasons"].get("PIPELINE_DISABLED", 0) + 1
                        else:
                            val_res = validator.validate(f_path)
                            if not val_res.success:
                                item_diag["status"] = "VALIDATION_FAILED"
                                item_diag["reason"] = f"Validation Error: {val_res.error_code}"
                                ch_report["summary"]["skipped_reasons"][val_res.error_code] = ch_report["summary"]["skipped_reasons"].get(val_res.error_code, 0) + 1
                            else:
                                dup_res = duplicate_checker.check(val_res.video_id, f_path, db, channel_id=ch.id)
                                if dup_res.is_duplicate:
                                    item_diag["status"] = "DUPLICATE_SKIPPED"
                                    item_diag["reason"] = f"Already Ingested or User-Deleted ({dup_res.reason})"
                                    ch_report["summary"]["skipped_reasons"]["DUPLICATE_OR_DELETED"] = ch_report["summary"]["skipped_reasons"].get("DUPLICATE_OR_DELETED", 0) + 1
                                else:
                                    ch_report["summary"]["ingestible_videos"] += 1

                        ch_report["items_found"].append(item_diag)

            reports.append(ch_report)

        return {"success": True, "data": {"reports": reports}}

    @staticmethod
    def force_ingest(db: Session, channel_id: Optional[str] = None):
        import json
        from models import Channel, IgnoredVideo
        from services.watch_folder.engine import get_engine

        channels = db.query(Channel).all()
        if channel_id:
            channels = [c for c in channels if c.id == channel_id]

        for ch in channels:
            pipelines = {}
            try:
                pipelines = json.loads(ch.pipelines) if ch.pipelines else {}
            except Exception:
                pipelines = {}

            for p_key in ["long", "shorts"]:
                if p_key not in pipelines:
                    pipelines[p_key] = {}
                pipelines[p_key]["enabled"] = True
                if not pipelines[p_key].get("watch_folder") and ch.watch_folder:
                    pipelines[p_key]["watch_folder"] = ch.watch_folder

            ch.pipelines = json.dumps(pipelines)
            ch.watch_folder_enabled = True

            # Clear tombstone/ignored entries for this channel so force_ingest can re-import videos
            db.query(IgnoredVideo).filter(IgnoredVideo.channel_id == ch.id).delete()

            # Clear existing non-active tasks (WATCHED, REVIEW, CANCELLED, FAILED, WAITING) for this channel
            # so force_ingest can re-ingest all watch folder videos fresh into Review Workspace
            from models import UploadTask
            db.query(UploadTask).filter(
                UploadTask.channel_id == ch.id,
                UploadTask.status.in_(["WATCHED", "REVIEW", "CANCELLED", "FAILED", "WAITING"])
            ).delete(synchronize_session=False)

        db.commit()

        engine = get_engine()
        summary = engine.scan_now(channel_id=channel_id)

        return {
            "success": True,
            "data": {
                "tasks_created": summary.tasks_created,
                "packages_found": summary.packages_found,
                "message": f"Force ingest completed! {summary.tasks_created} videos created into Review Workspace."
            }
        }
