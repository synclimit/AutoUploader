from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from models import Account, Profile
from schemas import AccountCreate, AccountUpdate, ConfirmChannelRequest
from typing import List, Optional
import os
import pickle
from google.auth.transport.requests import Request
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly", "https://www.googleapis.com/auth/yt-analytics.readonly"]
from services.system.path_service import PathService
from core.config import get_client_secret_path

TOKENS_DIR = os.path.join(PathService.get_appdata_dir(), "tokens")
ACCOUNTS_TOKEN_DIR = os.path.join(TOKENS_DIR, "accounts")
os.makedirs(ACCOUNTS_TOKEN_DIR, exist_ok=True)

class ChannelService:
    @staticmethod
    def _debug_log(msg):
        try:
            desktop = os.path.join(os.path.join(os.environ['USERPROFILE']), 'Desktop')
            log_path_desktop = os.path.join(desktop, 'AutoUploader_Debug.txt')
            with open(log_path_desktop, 'a', encoding='utf-8') as f:
                f.write(msg + '\n')
        except:
            pass
        try:
            appdata = os.path.join(os.environ['APPDATA'], 'AutoUploader', 'logs')
            os.makedirs(appdata, exist_ok=True)
            log_path_appdata = os.path.join(appdata, 'AutoUploader_Debug.txt')
            with open(log_path_appdata, 'a', encoding='utf-8') as f:
                f.write(msg + '\n')
        except:
            pass

    @staticmethod
    def _populate_profile_name(account: Account, db: Session):
        ChannelService._debug_log("START _populate_profile_name")
        try:
            if account.profile_id:
                profile = db.query(Profile).filter(Profile.id == account.profile_id).first()
                if profile:
                    account.profile_name = profile.name
            ChannelService._debug_log("SUCCESS _populate_profile_name")
        except Exception as e:
            ChannelService._debug_log(f"FAILED _populate_profile_name\nException: {str(e)}\nAccount ID: {account.id}")
            import traceback
            ChannelService._debug_log(traceback.format_exc())
            raise e
        return account

    @staticmethod
    def _populate_avatar_url(account: Account, db: Session):
        ChannelService._debug_log("START _populate_avatar_url")
        if account.authentication_status == "Connected" and not getattr(account, "avatar_url", None):
            try:
                token_path = os.path.join(ACCOUNTS_TOKEN_DIR, f"{account.id}.pickle")
                if os.path.exists(token_path):
                    with open(token_path, "rb") as token_file:
                        creds = pickle.load(token_file)
                    if creds and not getattr(creds, "expired", True):
                        youtube = build("youtube", "v3", credentials=creds)
                        res = youtube.channels().list(mine=True, part="snippet").execute()
                        if res.get("items"):
                            url = res["items"][0].get("snippet", {}).get("thumbnails", {}).get("default", {}).get("url")
                            if url:
                                account.avatar_url = url
                                db.commit()
                ChannelService._debug_log("SUCCESS _populate_avatar_url")
            except Exception as e:
                ChannelService._debug_log(f"FAILED _populate_avatar_url\nException: {str(e)}\nAccount ID: {account.id}")
                import traceback
                ChannelService._debug_log(traceback.format_exc())
                raise e
        else:
            ChannelService._debug_log("SUCCESS _populate_avatar_url (Skipped/Already Has Avatar)")
        return account

    @staticmethod
    def _populate_dashboard_fields(account: Account, db: Session):
        ChannelService._debug_log("START _populate_dashboard_fields")
        from models import UploadTask
        from schemas import QueueStatusEnum
        from datetime import datetime
        
        try:
            # Calculate Queue (WAITING, SCHEDULED, QUEUED)
            queue_count = db.query(UploadTask).filter(
                UploadTask.account_id == account.id,
                UploadTask.status.in_([QueueStatusEnum.watched, QueueStatusEnum.review, QueueStatusEnum.scheduled, QueueStatusEnum.queued])
            ).count()
            account.queue = queue_count
            
            # Calculate Completed Today
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            completed_today = db.query(UploadTask).filter(
                UploadTask.account_id == account.id,
                UploadTask.status == QueueStatusEnum.completed,
                UploadTask.completed_at >= today_start
            ).count()
            account.completed = completed_today
            
            # Calculate Last Upload Text
            if completed_today > 0:
                account.lastUploadText = "Today"
            else:
                last_upload = db.query(UploadTask).filter(
                    UploadTask.account_id == account.id,
                    UploadTask.status == QueueStatusEnum.completed
                ).order_by(UploadTask.completed_at.desc()).first()
                
                if last_upload and last_upload.completed_at:
                    delta = datetime.utcnow() - last_upload.completed_at
                    days = delta.days
                    if days <= 1:
                        account.lastUploadText = "Yesterday"
                    else:
                        account.lastUploadText = f"{days} days ago"
                else:
                    account.lastUploadText = "Never"
                    
            # Status and Attention
            account.status = "healthy"
            account.attention = "✓ Normal"
            
            if account.authentication_status != "Connected":
                account.status = "error"
                account.attention = "⚠ OAuth Expired"
            elif queue_count > 20: 
                account.status = "warning"
                account.attention = "⚠ Queue Full"
            elif "days ago" in account.lastUploadText:
                try:
                    days = int(account.lastUploadText.split()[0])
                    if days >= 7:
                        account.status = "error"
                        account.attention = "⚠ No Upload 7 Days"
                except:
                    pass
            
            account.views = "0"
            account.videos = "0"
            account.monetized = True if account.publish_enabled else False
            account.handle = "@" + account.channel_name.replace(" ", "").lower()
            ChannelService._debug_log("SUCCESS _populate_dashboard_fields")
        except Exception as e:
            ChannelService._debug_log(f"FAILED _populate_dashboard_fields\nException: {str(e)}\nAccount ID: {account.id}")
            import traceback
            ChannelService._debug_log(traceback.format_exc())
            raise e

    @staticmethod
    def get_all(db: Session) -> List[Account]:
        import logging
        logger = logging.getLogger("ChannelService")
        logger.info("[ChannelService] get_all Started")
        
        try:
            accounts = db.query(Account).all()
            ChannelService._debug_log(f"Account Count: {len(accounts)}")
        except Exception as e:
            logger.error(f"[ChannelService] Database query failed: {e}", exc_info=True)
            raise e
            
        valid_accounts = []
        for i, acc in enumerate(accounts):
            ChannelService._debug_log(f"Account ID: {acc.id}")
            ChannelService._debug_log(f"Channel Name: {getattr(acc, 'channel_name', 'Unknown')}")
            ChannelService._debug_log(f"Channel ID: {getattr(acc, 'channel_id', 'Unknown')}")
            try:
                ChannelService._populate_profile_name(acc, db)
                ChannelService._populate_avatar_url(acc, db)
                ChannelService._populate_dashboard_fields(acc, db)
                valid_accounts.append(acc)
            except Exception as e:
                logger.error(f"[ChannelService] Failed to populate account {acc.id} ({getattr(acc, 'channel_name', 'Unknown')}): {e}", exc_info=True)
                # DO NOT CRASH THE ENDPOINT! We want to test Phase 7 "Continue execution"
                continue
                
        logger.info("[ChannelService] Serialize Response & Return")
        return valid_accounts

    @staticmethod
    def get_dashboard_projection(db: Session) -> List[Account]:
        """Lightweight fetch strictly for Dashboard (skips expensive avatar/YouTube API calls)."""
        import logging
        logger = logging.getLogger("ChannelService")
        try:
            accounts = db.query(Account).all()
        except Exception as e:
            logger.error(f"[ChannelService] Projection query failed: {e}", exc_info=True)
            return []
            
        valid_accounts = []
        for acc in accounts:
            try:
                # Do NOT call _populate_avatar_url (avoids blocking YouTube API)
                # Do NOT call _populate_profile_name (Dashboard doesn't need profile names)
                ChannelService._populate_dashboard_fields(acc, db)
                valid_accounts.append(acc)
            except Exception as e:
                logger.error(f"[ChannelService] Failed to project account {acc.id}: {e}", exc_info=True)
                continue
                
        return valid_accounts

    @staticmethod
    def get_by_id(db: Session, account_id: str) -> Account:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        ChannelService._populate_profile_name(account, db)
        ChannelService._populate_avatar_url(account, db)
        return account

    @staticmethod
    def create(db: Session, data: AccountCreate) -> Account:
        import logging
        logger = logging.getLogger("ChannelService")
        logger.info(f"[ChannelService] Account Insert Started for {data.channel_name}")
        db_account = Account(
            channel_name=data.channel_name,
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
            db.commit()
            logger.info(f"[ChannelService] Database Commit Success for {db_account.id}")
            db.refresh(db_account)
            ChannelService._populate_profile_name(db_account, db)
            logger.info("[ChannelService] Account Insert Finished")
            return db_account
        except IntegrityError as e:
            db.rollback()
            logger.error(f"[ChannelService] Account Insert Failed (IntegrityError): {e}")
            raise HTTPException(status_code=409, detail="Channel Name Already Exists")
        except Exception as e:
            db.rollback()
            logger.error(f"[ChannelService] Account Insert Failed (Exception): {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Internal Server Error")

    @staticmethod
    def update(db: Session, account_id: str, data: AccountUpdate) -> Account:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        if data.watch_folder is not None:
            if data.watch_folder.strip():
                existing = db.query(Account).filter(
                    Account.watch_folder == data.watch_folder, 
                    Account.id != account_id
                ).first()
                if existing:
                    raise HTTPException(status_code=409, detail="Watch Folder Already In Use")
            
        if data.channel_name is not None:
            account.channel_name = data.channel_name
        if data.source_type is not None:
            account.source_type = data.source_type
        if data.region is not None:
            account.region = data.region
        if data.profile_id is not None:
            if data.profile_id.strip() == "":
                account.profile_id = None
            else:
                profile = db.query(Profile).filter(Profile.id == data.profile_id).first()
                if not profile:
                    raise HTTPException(status_code=404, detail="Profile not found")
                account.profile_id = data.profile_id
        if data.watch_folder is not None:
            account.watch_folder = data.watch_folder if data.watch_folder.strip() else None
        if data.watch_folder_enabled is not None:
            account.watch_folder_enabled = data.watch_folder_enabled
            
        if data.publish_enabled is not None: account.publish_enabled = data.publish_enabled
        if data.preferred_publish_time is not None: account.preferred_publish_time = data.preferred_publish_time
        if data.publish_timezone is not None: account.publish_timezone = data.publish_timezone
        if data.publish_variance is not None: account.publish_variance = data.publish_variance
        if data.publish_mode is not None: account.publish_mode = data.publish_mode
        if data.publish_days is not None: account.publish_days = data.publish_days
        if data.publish_visibility is not None: account.publish_visibility = data.publish_visibility
        if data.review_before_publish is not None: account.review_before_publish = data.review_before_publish
        if data.browser_profile is not None: account.browser_profile = data.browser_profile
        if data.metadata_profile is not None: account.metadata_profile = data.metadata_profile
        if data.upload_preset is not None: account.upload_preset = data.upload_preset
        if data.playlist is not None: account.playlist = data.playlist
        if data.audience is not None: account.audience = data.audience
        if data.license is not None: account.license = data.license
        if data.language is not None: account.language = data.language
        if data.upload_defaults is not None: account.upload_defaults = data.upload_defaults
        if data.advanced_settings is not None: account.advanced_settings = data.advanced_settings
        if data.ai_identity is not None: account.ai_identity = data.ai_identity
        if data.schedule_profile is not None: account.schedule_profile = data.schedule_profile
        
        if data.pipelines is not None: 
            account.pipelines = data.pipelines
            # Update pending tasks schedules to match new pipelines
            try:
                import json
                from models import UploadTask
                from schemas import QueueStatusEnum
                
                pipelines_dict = json.loads(data.pipelines) if isinstance(data.pipelines, str) else data.pipelines
                if isinstance(pipelines_dict, dict):
                    pending_tasks = db.query(UploadTask).filter(
                        UploadTask.account_id == account_id,
                        UploadTask.status.in_([QueueStatusEnum.watched, QueueStatusEnum.review])
                    ).order_by(UploadTask.created_at.asc()).all()
                    
                    from collections import defaultdict
                    grouped = defaultdict(list)
                    for pt in pending_tasks:
                        pkey = pt.pipeline_type or "long"
                        grouped[pkey].append(pt)
                        
                    for pkey, tasks_in_pipe in grouped.items():
                        schedule_list = pipelines_dict.get(pkey, {}).get("schedule")
                        if schedule_list and isinstance(schedule_list, list) and len(schedule_list) > 0:
                            for idx, pt in enumerate(tasks_in_pipe):
                                pt.schedule_time = str(schedule_list[idx % len(schedule_list)])
            except Exception as e:
                import logging
                logging.getLogger("ChannelService").error(f"Failed to update pending tasks schedule: {e}")

        if data.pipeline_states is not None: account.pipeline_states = data.pipeline_states

        try:
            db.commit()
            db.refresh(account)
            ChannelService._populate_profile_name(account, db)
            return account
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=409, detail="Channel Name Already Exists")

    @staticmethod
    def delete(db: Session, account_id: str) -> None:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        db.delete(account)
        db.commit()

    @staticmethod
    def get_auth_url(db: Session, account_id: str, temp_credentials: dict) -> str:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        try:
            flow = Flow.from_client_secrets_file(
                str(get_client_secret_path()),
                scopes=SCOPES,
                redirect_uri="http://localhost:8000/api/v1/accounts/oauth-callback"
            )
        except FileNotFoundError:
            raise HTTPException(status_code=400, detail="client_secret.json is missing! Please put your client_secret.json in the same folder as AutoUploader.exe or AppData.")
            
        auth_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            state=account_id,
            prompt='consent'
        )
        if hasattr(flow, 'code_verifier'):
            temp_credentials[f"{account_id}_verifier"] = flow.code_verifier
            
        return auth_url

    @staticmethod
    def oauth_callback(db: Session, code: str, state: str, temp_credentials: dict) -> dict:
        account_id = state
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found for state")

        try:
            flow = Flow.from_client_secrets_file(
                str(get_client_secret_path()),
                scopes=SCOPES,
                redirect_uri="http://localhost:8000/api/v1/accounts/oauth-callback"
            )
        except FileNotFoundError:
            raise HTTPException(status_code=400, detail="client_secret.json is missing! Please put your client_secret.json in the same folder as AutoUploader.exe or AppData.")
        verifier = temp_credentials.get(f"{account_id}_verifier")
        if verifier:
            flow.code_verifier = verifier
            
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        youtube = build("youtube", "v3", credentials=credentials)
        channels_response = youtube.channels().list(mine=True, part="id,snippet,statistics").execute()
        
        if not channels_response.get("items"):
            raise HTTPException(status_code=400, detail="No YouTube channel found for this Google account.")
            
        channel_info = channels_response["items"][0]
        channel_id = channel_info["id"]
        channel_name = channel_info["snippet"]["title"]
        subscribers = channel_info.get("statistics", {}).get("subscriberCount", "0")
        avatar_url = channel_info.get("snippet", {}).get("thumbnails", {}).get("default", {}).get("url")
        
        temp_credentials[account_id] = {
            "credentials": credentials,
            "subscribers": subscribers,
            "avatar_url": avatar_url
        }
        account.authentication_status = "Pending Confirmation"
        db.commit()
        
        return {
            "account_id": account_id,
            "channel_id": channel_id,
            "channel_name": channel_name,
            "avatar_url": avatar_url
        }

    @staticmethod
    def confirm_channel(db: Session, account_id: str, request: ConfirmChannelRequest, temp_credentials: dict) -> Account:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
            
        temp_data = temp_credentials.pop(account_id, None)
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
            
        token_path = os.path.join(ACCOUNTS_TOKEN_DIR, f"{account_id}.pickle")
        with open(token_path, "wb") as token_file:
            pickle.dump(credentials, token_file)
            
        account.channel_id = request.channel_id
        if request.channel_name:
            account.channel_name = request.channel_name
        account.subscribers = subscribers
        if avatar_url:
            account.avatar_url = avatar_url
        account.authentication_status = "Connected"
        
        import logging
        logger = logging.getLogger("ChannelService")
        logger.info(f"[ChannelService] OAuth Success for Account {account.id}")
        
        try:
            db.commit()
            logger.info(f"[ChannelService] Database Commit Success for {account.id}")
        except Exception as e:
            db.rollback()
            logger.error(f"[ChannelService] Database Commit Failed during confirmation: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Database error during confirmation")
            
        db.refresh(account)
        ChannelService._populate_profile_name(account, db)
        ChannelService._populate_avatar_url(account, db)
        return account

    @staticmethod
    def disconnect_channel(db: Session, account_id: str) -> Account:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
            
        token_path = os.path.join(ACCOUNTS_TOKEN_DIR, f"{account_id}.pickle")
        if os.path.exists(token_path):
            os.remove(token_path)
            
        account.channel_id = None
        account.authentication_status = "Disconnected"
        
        db.commit()
        db.refresh(account)
        ChannelService._populate_profile_name(account, db)
        return account
    @staticmethod
    def refresh_token(db: Session, account_id: str) -> Account:
        account = db.query(Account).filter(Account.id == account_id).first()
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
            
        token_path = os.path.join(ACCOUNTS_TOKEN_DIR, f"{account_id}.pickle")
        if not os.path.exists(token_path):
            raise HTTPException(status_code=400, detail="Not connected")
            
        with open(token_path, "rb") as token_file:
            credentials = pickle.load(token_file)
            
        if credentials:
            if credentials.expired and credentials.refresh_token:
                credentials.refresh(Request())
                with open(token_path, "wb") as token_file:
                    pickle.dump(credentials, token_file)
            
            try:
                from googleapiclient.discovery import build
                youtube = build("youtube", "v3", credentials=credentials)
                channels_response = youtube.channels().list(mine=True, part="id,snippet,statistics").execute()
                if channels_response.get("items"):
                    item = channels_response["items"][0]
                    account.subscribers = item.get("statistics", {}).get("subscriberCount", "0")
                    avatar = item.get("snippet", {}).get("thumbnails", {}).get("default", {}).get("url")
                    if avatar:
                        account.avatar_url = avatar
                    db.commit()
            except Exception as e:
                print(f"Failed to refresh subscriber count: {e}")
                
        ChannelService._populate_profile_name(account, db)
        ChannelService._populate_avatar_url(account, db)
        return account
