from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from models import Channel, Profile
from schemas import AccountCreate, AccountUpdate, ConfirmChannelRequest
from typing import List, Optional
import os
import pickle
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/yt-analytics.readonly"]
from services.system.path_service import PathService

TOKENS_DIR = os.path.join(PathService.get_appdata_dir(), "tokens")
ACCOUNTS_TOKEN_DIR = os.path.join(TOKENS_DIR, "channels")
os.makedirs(ACCOUNTS_TOKEN_DIR, exist_ok=True)

class ChannelService:
    @staticmethod
    def _debug_log(msg):
        pass

    @staticmethod
    def _populate_profile_name(channel: Channel, db: Session):
        ChannelService._debug_log("START _populate_profile_name")
        try:
            if channel.profile_id:
                profile = db.query(Profile).filter(Profile.id == channel.profile_id).first()
                if profile:
                    channel.profile_name = profile.name
            ChannelService._debug_log("SUCCESS _populate_profile_name")
        except Exception as e:
            ChannelService._debug_log(f"FAILED _populate_profile_name\nException: {str(e)}\nAccount ID: {channel.id}")
            import traceback
            ChannelService._debug_log(traceback.format_exc())
            raise e
        return channel

    @staticmethod
    def _populate_avatar_url(channel: Channel, db: Session):
        ChannelService._debug_log("START _populate_avatar_url")
        auth_status = getattr(channel, "authentication_status", "")
        if auth_status == "Connected" and not getattr(channel, "avatar_url", None):
            try:
                from services.oauth_core.oauth_repository import OAuthRepository
                from services.oauth_core.oauth_client import OAuthClient
                
                token = OAuthRepository.load_token(db, channel.id)
                if token:
                    creds = OAuthClient.build_credentials(token, channel.id)
                    youtube = build("youtube", "v3", credentials=creds, static_discovery=False)
                    res = youtube.channels().list(mine=True, part="snippet").execute()
                    if res.get("items"):
                        url = res["items"][0].get("snippet", {}).get("thumbnails", {}).get("default", {}).get("url")
                        if url:
                            channel.avatar_url = url
                            db.commit()
                ChannelService._debug_log("SUCCESS _populate_avatar_url")
            except Exception as e:
                ChannelService._debug_log(f"FAILED _populate_avatar_url\nException: {str(e)}\nAccount ID: {channel.id}")
                import traceback
                ChannelService._debug_log(traceback.format_exc())
                # Don't fail the request if avatar fails
        else:
            ChannelService._debug_log("SUCCESS _populate_avatar_url (Skipped/Already Has Avatar)")
        return channel

    @staticmethod
    def _populate_dashboard_fields(channel: Channel, db: Session):
        ChannelService._debug_log("START _populate_dashboard_fields")
        from models import UploadTask
        from schemas import QueueStatusEnum
        from datetime import datetime
        
        try:
            # Calculate Queue (WAITING, SCHEDULED, QUEUED)
            queue_count = db.query(UploadTask).filter(
                UploadTask.channel_id == channel.id,
                UploadTask.status.in_([QueueStatusEnum.watched, QueueStatusEnum.review, QueueStatusEnum.scheduled, QueueStatusEnum.queued])
            ).count()
            channel.queue = queue_count
            
            # Calculate Completed Today
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            completed_today = db.query(UploadTask).filter(
                UploadTask.channel_id == channel.id,
                UploadTask.status == QueueStatusEnum.completed,
                UploadTask.completed_at >= today_start
            ).count()
            channel.completed = completed_today
            
            # Calculate Last Upload Text
            if completed_today > 0:
                channel.lastUploadText = "Today"
            else:
                last_upload = db.query(UploadTask).filter(
                    UploadTask.channel_id == channel.id,
                    UploadTask.status == QueueStatusEnum.completed
                ).order_by(UploadTask.completed_at.desc()).first()
                
                if last_upload and last_upload.completed_at:
                    delta = datetime.utcnow() - last_upload.completed_at
                    days = delta.days
                    if days <= 1:
                        channel.lastUploadText = "Yesterday"
                    else:
                        channel.lastUploadText = f"{days} days ago"
                else:
                    channel.lastUploadText = "Never"
                    
            # Status and Attention
            channel.status = "healthy"
            channel.attention = "✓ Normal"
            
            from services.oauth_core.oauth_health import OAuthHealth
            from services.oauth_core.oauth_repository import OAuthRepository
            from services.oauth_core.oauth_types import OAuthHealthStatus
            
            health_report = OAuthHealth.evaluate(db, channel.id)
            
            if health_report.status != OAuthHealthStatus.READY:
                if health_report.status == OAuthHealthStatus.REFRESH_REQUIRED:
                    try:
                        from services.oauth_core.refresh_service import RefreshService
                        current_token = OAuthRepository.load_token(db, channel.id)
                        new_token = RefreshService.refresh(db, channel.id, current_token)
                        channel.authentication_status = "Connected"
                        channel.status = "healthy"
                        channel.attention = "✓ Normal"
                    except Exception as e:
                        channel.authentication_status = "Disconnected"
                        channel.status = "error"
                        channel.attention = "⚠ Refresh Failed"
                else:
                    channel.authentication_status = "Disconnected"
                    channel.status = "error"
                    if health_report.status == OAuthHealthStatus.NOT_CONNECTED:
                        channel.attention = "⚠ Not Connected"
                    else:
                        channel.attention = "⚠ OAuth Expired"
            else:
                channel.authentication_status = "Connected"
                
            if channel.status == "healthy":
                if queue_count > 20: 
                    channel.status = "warning"
                    channel.attention = "⚠ Queue Full"
                elif "days ago" in getattr(channel, 'lastUploadText', ''):
                    try:
                        days = int(channel.lastUploadText.split()[0])
                        if days >= 7:
                            channel.status = "error"
                            channel.attention = "⚠ No Upload 7 Days"
                    except:
                        pass
            
            channel.views = "0"
            channel.videos = "0"
            channel.monetized = True if channel.publish_enabled else False
            channel.handle = "@" + channel.channel_name.replace(" ", "").lower()
            
            # --- Coverage Automation (Sprint 4.1) ---
            from models import CampaignReviewSession, CampaignUploadPlan
            active_campaigns = db.query(CampaignReviewSession).filter(
                CampaignReviewSession.channel_id == channel.id,
                CampaignReviewSession.status != "FINISHED"
            ).all()
            
            active_plans_exist = db.query(CampaignUploadPlan).filter(
                CampaignUploadPlan.channel_id == channel.id,
                CampaignUploadPlan.execution_status.notin_(["UPLOADED", "FAILED", "CANCELLED", "COMPLETED"])
            ).first() is not None

            channel.mode = "Campaign"
            if not active_campaigns and not active_plans_exist:
                channel.coverage = "0 Days"
                channel.attention = "Campaign Empty"
                channel.notification = "Create Next Campaign"
            else:
                channel.coverage = "Active"
                channel.notification = "Campaign Running"
                
            # Populate watch_folder and folder for UI Pickers
            channel.folder = None
            channel.watch_folder = None
            try:
                import json
                if getattr(channel, "pipelines", None):
                    pipelines = json.loads(channel.pipelines) if isinstance(channel.pipelines, str) else channel.pipelines
                    long_p = pipelines.get("long", {}) if isinstance(pipelines, dict) else {}
                    shorts_p = pipelines.get("shorts", {}) if isinstance(pipelines, dict) else {}
                    long_wf = long_p.get("watch_folder") or long_p.get("campaign_folder")
                    shorts_wf = shorts_p.get("watch_folder") or shorts_p.get("campaign_folder")
                    channel.folder = long_wf or shorts_wf
                    channel.watch_folder = long_wf or shorts_wf
            except:
                pass
            
            ChannelService._debug_log("SUCCESS _populate_dashboard_fields")
        except Exception as e:
            ChannelService._debug_log(f"FAILED _populate_dashboard_fields\nException: {str(e)}\nAccount ID: {channel.id}")
            import traceback
            ChannelService._debug_log(traceback.format_exc())
            raise e

    @staticmethod
    def get_all(db: Session) -> List[Channel]:
        import logging
        logger = logging.getLogger("ChannelService")
        logger.info("[ChannelService] get_all Started")
        
        try:
            channels = db.query(Channel).all()
            ChannelService._debug_log(f"Channel Count: {len(channels)}")
        except Exception as e:
            logger.error(f"[ChannelService] Database query failed: {e}", exc_info=True)
            raise e
            
        valid_accounts = []
        for i, acc in enumerate(channels):
            ChannelService._debug_log(f"Channel ID: {acc.id}")
            ChannelService._debug_log(f"Channel Name: {getattr(acc, 'channel_name', 'Unknown')}")
            ChannelService._debug_log(f"Channel ID: {getattr(acc, 'channel_id', 'Unknown')}")
            try:
                ChannelService._populate_profile_name(acc, db)
                ChannelService._populate_avatar_url(acc, db)
                ChannelService._populate_dashboard_fields(acc, db)
            except Exception as e:
                logger.error(f"[ChannelService] Non-fatal error populating channel {acc.id} ({getattr(acc, 'channel_name', 'Unknown')}): {e}", exc_info=True)
                from services.system.diagnostic_service import diagnostic_service
                diagnostic_service.log("WARNING", "CHANNEL", "POPULATE_WARNING", f"Failed populating metadata for channel {acc.id}: {e}", error_id="ERR-CHANNEL-001")
            valid_accounts.append(acc)
                
        logger.info("[ChannelService] Serialize Response & Return")
        return valid_accounts

    @staticmethod
    def get_dashboard_projection(db: Session) -> List[Channel]:
        """Lightweight fetch strictly for Dashboard (skips expensive avatar/YouTube API calls)."""
        import logging
        logger = logging.getLogger("ChannelService")
        try:
            channels = db.query(Channel).all()
        except Exception as e:
            logger.error(f"[ChannelService] Projection query failed: {e}", exc_info=True)
            return []
            
        valid_accounts = []
        for acc in channels:
            try:
                # Do NOT call _populate_avatar_url (avoids blocking YouTube API)
                # Do NOT call _populate_profile_name (Dashboard doesn't need profile names)
                ChannelService._populate_dashboard_fields(acc, db)
                valid_accounts.append(acc)
            except Exception as e:
                logger.error(f"[ChannelService] Failed to project channel {acc.id}: {e}", exc_info=True)
                continue
                
        return valid_accounts

    @staticmethod
    def get_by_id(db: Session, channel_id: str) -> Channel:
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        ChannelService._populate_profile_name(channel, db)
        ChannelService._populate_avatar_url(channel, db)
        ChannelService._populate_dashboard_fields(channel, db)
        return channel

    @staticmethod
    def create(db: Session, data: AccountCreate) -> Channel:
        import logging
        logger = logging.getLogger("ChannelService")
        logger.info(f"[ChannelService] Channel Insert Started for {data.channel_name}")
        db_account = Channel(
            alias_name=data.channel_name,
            source_type=data.source_type,
            region=data.region,
            profile_id=getattr(data, 'profile_id', None),
            watch_folder=getattr(data, 'watch_folder', None),
            watch_folder_enabled=getattr(data, 'watch_folder_enabled', False),
            browser_profile=getattr(data, 'browser_profile', None),
            metadata_profile=getattr(data, 'metadata_profile', None),
            upload_preset=getattr(data, 'upload_preset', None),
            playlist=getattr(data, 'playlist', None),
            audience=getattr(data, 'audience', 'not_kids'),
            license=getattr(data, 'license', 'standard'),
            language=getattr(data, 'language', 'en'),
            upload_defaults=getattr(data, 'upload_defaults', '{}'),
            advanced_settings=getattr(data, 'advanced_settings', '{}'),
            ai_identity=getattr(data, 'ai_identity', '{}'),
            schedule_profile=getattr(data, 'schedule_profile', '{}')
        )
        try:
            db.add(db_account)
            try:
                from sqlalchemy import text
                db.execute(
                    text("INSERT OR IGNORE INTO accounts (id, channel_name) VALUES (:id, :name)"),
                    {"id": db_account.id, "name": db_account.alias_name}
                )
            except Exception:
                pass
            db.commit()
            logger.info(f"[ChannelService] Database Commit Success for {db_account.id}")
            db.refresh(db_account)
            ChannelService._populate_profile_name(db_account, db)
            ChannelService._populate_dashboard_fields(db_account, db)
            ChannelService._populate_avatar_url(db_account, db)
            logger.info("[ChannelService] Channel Insert Finished")
            return db_account
        except IntegrityError as e:
            db.rollback()
            logger.error(f"[ChannelService] Channel Insert Failed (IntegrityError): {e}")
            raise HTTPException(status_code=409, detail="Channel Name Already Exists")
        except Exception as e:
            db.rollback()
            logger.error(f"[ChannelService] Channel Insert Failed (Exception): {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal Server Error")

    @staticmethod
    def update(db: Session, channel_id: str, data: AccountUpdate) -> Channel:
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        if data.watch_folder is not None:
            if data.watch_folder.strip():
                existing = db.query(Channel).filter(
                    Channel.watch_folder == data.watch_folder, 
                    Channel.id != channel_id
                ).first()
                if existing:
                    raise HTTPException(status_code=409, detail="Watch Folder Already In Use")
            
        if data.channel_name is not None:
            channel.channel_name = data.channel_name
        if data.source_type is not None:
            channel.source_type = data.source_type
        if data.region is not None:
            channel.region = data.region
        if data.profile_id is not None:
            if data.profile_id.strip() == "":
                channel.profile_id = None
            else:
                profile = db.query(Profile).filter(Profile.id == data.profile_id).first()
                if not profile:
                    raise HTTPException(status_code=404, detail="Profile not found")
                channel.profile_id = data.profile_id
        if data.watch_folder is not None:
            channel.watch_folder = data.watch_folder if data.watch_folder.strip() else None
            if channel.watch_folder:
                channel.watch_folder_enabled = True
        if data.watch_folder_enabled is not None:
            channel.watch_folder_enabled = data.watch_folder_enabled
            
        if data.publish_enabled is not None: channel.publish_enabled = data.publish_enabled
        if data.preferred_publish_time is not None: channel.preferred_publish_time = data.preferred_publish_time
        if data.publish_timezone is not None: channel.publish_timezone = data.publish_timezone
        if data.publish_variance is not None: channel.publish_variance = data.publish_variance
        if data.publish_mode is not None: channel.publish_mode = data.publish_mode
        if data.publish_days is not None: channel.publish_days = data.publish_days
        if data.publish_visibility is not None: channel.publish_visibility = data.publish_visibility
        if data.review_before_publish is not None: channel.review_before_publish = data.review_before_publish
        if data.browser_profile is not None: channel.browser_profile = data.browser_profile
        if data.metadata_profile is not None: channel.metadata_profile = data.metadata_profile
        if data.upload_preset is not None: channel.upload_preset = data.upload_preset
        if data.playlist is not None: channel.playlist = data.playlist
        if data.audience is not None: channel.audience = data.audience
        if data.license is not None: channel.license = data.license
        if data.language is not None: channel.language = data.language
        if data.upload_defaults is not None: channel.upload_defaults = data.upload_defaults
        if data.advanced_settings is not None: channel.advanced_settings = data.advanced_settings
        if data.ai_identity is not None: channel.ai_identity = data.ai_identity
        if data.schedule_profile is not None: channel.schedule_profile = data.schedule_profile
        
        if data.pipelines is not None: 
            channel.pipelines = data.pipelines
            try:
                import json
                pipes = json.loads(data.pipelines) if isinstance(data.pipelines, str) else data.pipelines
                if isinstance(pipes, dict):
                    long_wf = pipes.get("long", {}).get("watch_folder") or pipes.get("long", {}).get("campaign_folder")
                    shorts_wf = pipes.get("shorts", {}).get("watch_folder") or pipes.get("shorts", {}).get("campaign_folder")
                    if long_wf or shorts_wf:
                        channel.watch_folder = long_wf or shorts_wf
            except Exception:
                pass
            # Update pending tasks schedules to match new pipelines
            try:
                import json
                import pytz
                import random
                from datetime import datetime, timedelta, time
                from models import UploadTask
                from schemas import QueueStatusEnum
                
                pipelines_dict = json.loads(data.pipelines) if isinstance(data.pipelines, str) else data.pipelines
                if isinstance(pipelines_dict, dict):
                    pending_tasks = db.query(UploadTask).filter(
                        UploadTask.channel_id == channel_id,
                        UploadTask.status.in_([QueueStatusEnum.watched, QueueStatusEnum.review])
                    ).order_by(UploadTask.created_at.asc()).all()
                    
                    from collections import defaultdict
                    grouped = defaultdict(list)
                    for pt in pending_tasks:
                        pkey = pt.pipeline_type or "long"
                        grouped[pkey].append(pt)
                        
                    tz_str = getattr(channel, "publish_timezone", None) or "Asia/Jakarta"
                    try:
                        tz = pytz.timezone(tz_str)
                    except Exception:
                        tz = pytz.timezone("Asia/Jakarta")

                    now_local = datetime.now(tz)

                    for pkey, tasks_in_pipe in grouped.items():
                        p_cfg = pipelines_dict.get(pkey, {})
                        schedule_list = p_cfg.get("schedule") or ["09:00"]
                        if not isinstance(schedule_list, list) or len(schedule_list) == 0:
                            schedule_list = ["09:00"]
                        
                        try:
                            daily_limit_val = int(p_cfg.get("daily_limit", 1) or 1)
                        except Exception:
                            daily_limit_val = 1
                        if daily_limit_val <= 0:
                            daily_limit_val = 1

                        h_cfg = p_cfg.get("humanize") or {}
                        h_enabled = bool(h_cfg.get("enabled", False))
                        try:
                            h_min = int(h_cfg.get("min_delay_minutes", 0) or 0)
                        except Exception:
                            h_min = 0
                        try:
                            h_max = int(h_cfg.get("max_delay_minutes", 0) or 0)
                        except Exception:
                            h_max = 0

                        # Check if first slot today has already passed; if so, start sequence from tomorrow
                        try:
                            first_parts = str(schedule_list[0]).split(":")
                            first_h = int(first_parts[0])
                            first_m = int(first_parts[1]) if len(first_parts) > 1 else 0
                        except Exception:
                            first_h = 9
                            first_m = 0

                        today_first_dt = tz.localize(datetime.combine(now_local.date(), time(first_h, first_m)))
                        base_day_shift = 1 if today_first_dt <= now_local else 0

                        used_slots_per_day = {}

                        for idx, pt in enumerate(tasks_in_pipe):
                            day_offset = base_day_shift + (idx // daily_limit_val)
                            slot_idx_in_day = idx % daily_limit_val

                            if slot_idx_in_day < len(schedule_list):
                                time_slot_str = str(schedule_list[slot_idx_in_day])
                            else:
                                start_hour = 9
                                end_hour = 21
                                step = (end_hour - start_hour) / max(1, daily_limit_val - 1)
                                slot_h = int(start_hour + slot_idx_in_day * step)
                                time_slot_str = f"{slot_h:02d}:00"

                            try:
                                parts = time_slot_str.split(":")
                                slot_hour = int(parts[0])
                                slot_minute = int(parts[1]) if len(parts) > 1 else 0
                            except Exception:
                                slot_hour = 9
                                slot_minute = 0

                            target_date = now_local.date() + timedelta(days=day_offset)
                            target_dt_local = tz.localize(datetime.combine(target_date, time(slot_hour, slot_minute)))

                            if h_enabled and h_min <= h_max and h_max > 0:
                                jitter = random.randint(h_min, h_max)
                                target_dt_local += timedelta(minutes=jitter)

                            day_key = target_dt_local.date()
                            if day_key not in used_slots_per_day:
                                used_slots_per_day[day_key] = set()

                            while target_dt_local.strftime("%H:%M") in used_slots_per_day[day_key]:
                                target_dt_local += timedelta(minutes=random.randint(3, 8))

                            used_slots_per_day[day_key].add(target_dt_local.strftime("%H:%M"))

                            pt.scheduled_at = target_dt_local.astimezone(pytz.UTC).replace(tzinfo=None)
                            pt.schedule_time = target_dt_local.strftime("%H:%M")
                            pt.schedule_mode = p_cfg.get("schedule_mode", "youtube")
                            pt.humanize_enabled = h_enabled
                            pt.humanize_min = h_min
                            pt.humanize_max = h_max
                            has_camp = bool(p_cfg.get("automation_strategy") == "campaign" or p_cfg.get("campaign_folder"))
                            pt.execution_source = "CAMPAIGN" if has_camp else "CONTINUOUS"
            except Exception as e:
                import logging
                logging.getLogger("ChannelService").error(f"Failed to update pending tasks schedule: {e}")

        if data.pipeline_states is not None: channel.pipeline_states = data.pipeline_states

        channel.schema_version = (getattr(channel, "schema_version", 1) or 1) + 1

        try:
            db.commit()
            db.refresh(channel)
            ChannelService._populate_profile_name(channel, db)
            ChannelService._populate_avatar_url(channel, db)
            ChannelService._populate_dashboard_fields(channel, db)
            
            # Immediately trigger watch / campaign folder scan for this channel
            try:
                from services.watch_folder_service import WatchFolderService
                from models import UploadTask
                db.query(UploadTask).filter(
                    UploadTask.channel_id == channel_id,
                    UploadTask.status.in_(["CANCELLED", "FAILED"])
                ).delete(synchronize_session=False)
                db.commit()

                WatchFolderService.trigger_scan_now(channel_id=channel_id)
            except Exception as scan_e:
                import logging
                logging.getLogger("ChannelService").warning(f"Auto-scan on channel update non-fatal error: {scan_e}")
                
            return channel
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Channel Name Already Exists")

    @staticmethod
    def delete(db: Session, channel_id: str) -> None:
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        # Clean up related tables to prevent FK errors or orphaned rows
        from sqlalchemy import text
        from models import UploadTask, IgnoredVideo, CampaignUploadPlan, CampaignReviewSession, CampaignAsset
        try:
            db.query(UploadTask).filter(UploadTask.channel_id == channel_id).delete(synchronize_session=False)
            db.query(IgnoredVideo).filter(IgnoredVideo.channel_id == channel_id).delete(synchronize_session=False)
            db.query(CampaignUploadPlan).filter(CampaignUploadPlan.channel_id == channel_id).delete(synchronize_session=False)
            db.query(CampaignReviewSession).filter(CampaignReviewSession.channel_id == channel_id).delete(synchronize_session=False)
            db.query(CampaignAsset).filter(CampaignAsset.channel_id == channel_id).delete(synchronize_session=False)
            db.execute(text("DELETE FROM accounts WHERE id = :id"), {"id": channel_id})
        except Exception as cleanup_err:
            import logging
            logging.getLogger("ChannelService").warning(f"Channel cascade cleanup notice: {cleanup_err}")

        db.delete(channel)
        db.commit()

    @staticmethod
    def get_auth_url(db: Session, channel_id: str, temp_credentials: dict) -> str:
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
        
        try:
            from services.credential_engine.storage_manager import StorageManager
            secret_path = StorageManager._get_secret_file(channel_id)
            if not secret_path.exists():
                raise FileNotFoundError()
                
            flow = Flow.from_client_secrets_file(
                str(secret_path),
                scopes=SCOPES,
                redirect_uri="http://localhost:8000/api/v1/channels/oauth-callback"
            )
        except FileNotFoundError:
            raise HTTPException(status_code=400, detail="client_secret.json is missing! Please configure OAuth credential for this channel.")
            
        auth_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=channel_id,
            prompt='consent select_account'
        )
        if hasattr(flow, 'code_verifier'):
            temp_credentials[f"{channel_id}_verifier"] = flow.code_verifier
            
        return auth_url

    @staticmethod
    def oauth_callback(db: Session, code: str, state: str, temp_credentials: dict) -> dict:
        channel_id = state
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found for state")

        try:
            from services.credential_engine.storage_manager import StorageManager
            secret_path = StorageManager._get_secret_file(channel_id)
            if not secret_path.exists():
                raise FileNotFoundError()
                
            flow = Flow.from_client_secrets_file(
                str(secret_path),
                scopes=SCOPES,
                redirect_uri="http://localhost:8000/api/v1/channels/oauth-callback"
            )
        except FileNotFoundError:
            raise HTTPException(status_code=400, detail="client_secret.json is missing! Please configure OAuth credential for this channel.")
        verifier = temp_credentials.get(f"{channel_id}_verifier")
        if verifier:
            flow.code_verifier = verifier
            
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        youtube = build("youtube", "v3", credentials=credentials, static_discovery=False)
        channels_response = youtube.channels().list(mine=True, part="id,snippet,statistics").execute()
        
        if not channels_response.get("items"):
            raise HTTPException(status_code=400, detail="No YouTube channel found for this Google channel.")
            
        channel_info = channels_response["items"][0]
        yt_channel_id = channel_info["id"]
        channel_name = channel_info["snippet"]["title"]
        subscribers = channel_info.get("statistics", {}).get("subscriberCount", "0")
        avatar_url = channel_info.get("snippet", {}).get("thumbnails", {}).get("default", {}).get("url")
        
        temp_credentials[channel_id] = {
            "credentials": credentials,
            "subscribers": subscribers,
            "avatar_url": avatar_url,
            "channel_name": channel_name
        }
        channel.authentication_status = "Pending Confirmation"
        db.commit()
        
        return {
            "account_id": channel_id,
            "channel_id": yt_channel_id,
            "channel_name": channel_name,
            "avatar_url": avatar_url
        }

    @staticmethod
    def confirm_channel(db: Session, channel_id: str, request: ConfirmChannelRequest, temp_credentials: dict) -> Channel:
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
            
        temp_data = temp_credentials.pop(channel_id, None)
        if not temp_data:
            raise HTTPException(status_code=400, detail="OAuth session expired or invalid. Please connect again.")
            
        # Backward compatibility check
        if hasattr(temp_data, "expired"):
            credentials = temp_data
            subscribers = "0"
            avatar_url = getattr(request, "avatar_url", None)
        else:
            credentials = temp_data.get("credentials")
            subscribers = temp_data.get("subscribers", "0")
            avatar_url = temp_data.get("avatar_url") or getattr(request, "avatar_url", None)
            
        from services.oauth_core.oauth_repository import OAuthRepository
        from services.oauth_core.oauth_types import OAuthToken
        try:
            dt_str = credentials.expiry.isoformat() if credentials.expiry else None
            token = OAuthToken(
                access_token=credentials.token,
                refresh_token=credentials.refresh_token,
                expires_at=dt_str
            )
            OAuthRepository.save_or_update_token(db, channel_id, token)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save credentials to database: {str(e)}")
            
        channel.channel_id = request.channel_id
        
        yt_name = temp_data.get("channel_name") or getattr(request, "channel_name", None)
        if yt_name:
            channel.youtube_name = yt_name
                
        channel.subscribers = subscribers
        if avatar_url:
            channel.avatar_url = avatar_url
        channel.authentication_status = "Connected"
        
        import logging
        logger = logging.getLogger("ChannelService")
        logger.info(f"[ChannelService] OAuth Success for Channel {channel.id}")
        
        try:
            try:
                from sqlalchemy import text
                db.execute(
                    text("INSERT OR IGNORE INTO accounts (id, channel_name) VALUES (:id, :name)"),
                    {"id": channel.id, "name": getattr(channel, "alias_name", channel.channel_name)}
                )
            except Exception:
                pass
            db.commit()
            logger.info(f"[ChannelService] Database Commit Success for {channel.id}")
        except Exception as e:
            db.rollback()
            logger.error(f"[ChannelService] Database Commit Failed during confirmation: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Database error during confirmation")
            
        db.refresh(channel)
        ChannelService._populate_profile_name(channel, db)
        ChannelService._populate_avatar_url(channel, db)
        return channel

    @staticmethod
    def disconnect_channel(db: Session, channel_id: str) -> Channel:
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
            
        from services.oauth_core.oauth_repository import OAuthRepository
        try:
            OAuthRepository.delete_token(db, channel_id)
        except Exception as e:
            import logging
            logging.getLogger("ChannelService").error(f"Failed to delete DB token: {e}")
            
        token_path = os.path.join(ACCOUNTS_TOKEN_DIR, f"{channel_id}.pickle")
        if os.path.exists(token_path):
            os.remove(token_path)
            
        channel.channel_id = None
        channel.authentication_status = "Disconnected"
        
        db.commit()
        db.refresh(channel)
        ChannelService._populate_profile_name(channel, db)
        return channel
    @staticmethod
    def refresh_token(db: Session, channel_id: str) -> Channel:
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
            
        from services.oauth_core.oauth_repository import OAuthRepository
        from services.oauth_core.refresh_service import RefreshService
        from services.oauth_core.oauth_client import OAuthClient
        
        current_token = OAuthRepository.load_token(db, channel_id)
        if not current_token:
            raise HTTPException(status_code=400, detail="Not connected")
            
        try:
            new_token = RefreshService.refresh(db, channel_id, current_token)
            
            # Update subscriber count
            credentials = OAuthClient.build_credentials(new_token)
            from googleapiclient.discovery import build
            youtube = build("youtube", "v3", credentials=credentials, static_discovery=False)
            channels_response = youtube.channels().list(mine=True, part="id,snippet,statistics").execute()
            if channels_response.get("items"):
                item = channels_response["items"][0]
                channel.subscribers = item.get("statistics", {}).get("subscriberCount", "0")
                avatar = item.get("snippet", {}).get("thumbnails", {}).get("default", {}).get("url")
                if avatar:
                    channel.avatar_url = avatar
                db.commit()
        except Exception as e:
            import logging
            logging.getLogger("ChannelService").error(f"Failed to refresh token: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to refresh token: {e}")
                
        ChannelService._populate_profile_name(channel, db)
        ChannelService._populate_avatar_url(channel, db)
        return channel

    @staticmethod
    def get_playlists(db: Session, channel_id: str) -> List[dict]:
        channel = db.query(Channel).filter(Channel.id == channel_id).first()
        if not channel:
            raise HTTPException(status_code=404, detail="Channel not found")
            
        from services.oauth_core.oauth_repository import OAuthRepository
        from services.oauth_core.oauth_client import OAuthClient
        from services.oauth_core.refresh_service import RefreshService
        
        current_token = OAuthRepository.load_token(db, channel_id)
        if not current_token:
            raise HTTPException(status_code=400, detail="Not connected to YouTube")
            
        try:
            # Auto-refresh if needed
            if RefreshService.is_expired(current_token):
                current_token = RefreshService.refresh(db, channel_id, current_token)
                
            credentials = OAuthClient.build_credentials(current_token, channel_id)
            from googleapiclient.discovery import build
            youtube = build("youtube", "v3", credentials=credentials, static_discovery=False)
            result = []
            request = youtube.playlists().list(mine=True, part="snippet,id", maxResults=50)
            while request is not None:
                playlists_response = request.execute()
                for item in playlists_response.get("items", []):
                    result.append({
                        "id": item["id"],
                        "title": item["snippet"]["title"]
                    })
                request = youtube.playlists().list_next(request, playlists_response)
            
            # Sort playlists alphabetically for better UX
            result.sort(key=lambda x: x["title"].lower())
            return result
        except Exception as e:
            import logging
            logging.getLogger("ChannelService").error(f"Failed to fetch playlists: {e}")
            raise HTTPException(status_code=500, detail="Failed to fetch playlists from YouTube")
