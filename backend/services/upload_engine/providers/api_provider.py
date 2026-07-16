import os
import time
import datetime
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from .base_provider import BaseUploader
from .upload_context import UploadContext
from .upload_result import UploadResult

class APIUploader(BaseUploader):
    def upload(self, context: UploadContext) -> UploadResult:
        task = context.task
        
        try:
            # 1. Authenticate
            from services.oauth_core.oauth_repository import OAuthRepository
            from services.oauth_core.oauth_client import OAuthClient
            from services.oauth_core.oauth_types import OAuthHealthStatus
            
            if not context.db_session:
                from database.db import SessionLocal
                db = SessionLocal()
            else:
                db = context.db_session
                
            try:
                token = OAuthRepository.load_token(db, task.channel_id)
                if not token or not token.access_token:
                    return UploadResult(
                        success=False,
                        error_code="AUTH_REQUIRED",
                        error_message=f"OAuth token not found for channel {task.channel_id}. Please connect YouTube."
                    )
                
                config = OAuthClient.load_configuration(task.channel_id)
                from google.oauth2.credentials import Credentials
                import datetime
                dt = datetime.datetime.fromisoformat(token.expires_at) if token.expires_at else None
                credentials = Credentials(
                    token=token.access_token,
                    refresh_token=token.refresh_token,
                    token_uri=config.token_uri,
                    client_id=config.client_id,
                    client_secret=config.client_secret,
                    scopes=config.scopes,
                    expiry=dt
                )
                
                if credentials and credentials.expired and credentials.refresh_token:
                    try:
                        context.logger.info(f"[APIUploader] Refreshing expired OAuth token for channel {task.channel_id} via RefreshService...")
                        from services.oauth_core.refresh_service import RefreshService
                        new_token = RefreshService.refresh(db, task.channel_id, token)
                        
                        # Rebuild credentials from new token
                        config = OAuthClient.load_configuration(task.channel_id)
                        dt = datetime.datetime.fromisoformat(new_token.expires_at) if new_token.expires_at else None
                        credentials = Credentials(
                            token=new_token.access_token,
                            refresh_token=new_token.refresh_token,
                            token_uri=config.token_uri,
                            client_id=config.client_id,
                            client_secret=config.client_secret,
                            scopes=config.scopes,
                            expiry=dt
                        )
                    except Exception as ref_err:
                        context.logger.error(f"[APIUploader] Token refresh failed: {ref_err}")
                        return UploadResult(
                            success=False,
                            error_code="AUTH_EXPIRED",
                            error_message=f"OAuth token refresh failed: {ref_err}. Please reconnect channel in Channels menu."
                        )
            finally:
                if not context.db_session:
                    db.close()
                
            youtube = build("youtube", "v3", credentials=credentials)
            
            # Helper to resolve Category ID
            def _resolve_category_id(val) -> str:
                if not val:
                    return "22"
                s_val = str(val).strip().lower()
                if s_val.isdigit():
                    return s_val
                cat_map = {
                    "film & animation": "1",
                    "autos & vehicles": "2",
                    "music": "10",
                    "pets & animals": "15",
                    "sports": "17",
                    "short movies": "18",
                    "travel & events": "19",
                    "gaming": "20",
                    "videoblogging": "21",
                    "people & blogs": "22",
                    "comedy": "23",
                    "entertainment": "24",
                    "news & politics": "25",
                    "howto & style": "26",
                    "education": "27",
                    "science & technology": "28",
                    "nonprofits & activism": "29"
                }
                return cat_map.get(s_val, "22")
            
            # 2. Prepare Video Metadata
            snippet = {
                "title": task.title or "Untitled Upload",
                "description": task.description or "Uploaded via AutoUploader",
                "categoryId": _resolve_category_id(getattr(task, "category_id", None))
            }
            if task.tags:
                snippet["tags"] = [tag.strip() for tag in task.tags.split(",") if tag.strip()]
            
            if getattr(task, "default_language", None):
                snippet["defaultLanguage"] = task.default_language
            if getattr(task, "audio_language", None):
                snippet["defaultAudioLanguage"] = task.audio_language
            
            status = {
                "privacyStatus": task.privacy_status or "private",
                "selfDeclaredMadeForKids": getattr(task, "made_for_kids", False),
                "embeddable": getattr(task, "embeddable", True),
                "publicStatsViewable": getattr(task, "public_stats_viewable", True)
            }
            
            if getattr(task, "ai_use", "UNKNOWN") not in (None, "", "UNKNOWN"):
                context.logger.warning(f"[APIUploader] WARNING: YouTube Data API v3 does not currently support setting the 'Altered or synthetic content' (AI Use) disclosure flag via REST API (task.ai_use={task.ai_use}). Video uploaded with default API disclosure. Use YouTube Studio manual toggle if required.")
            
            recording_details = {}
            if getattr(task, "recording_date", None):
                dt = task.recording_date
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=datetime.timezone.utc)
                recording_details["recordingDate"] = dt.isoformat()
            
            # PRIORITY 1: Scheduling Support
            if getattr(task, "scheduled_at", None):
                status["privacyStatus"] = "private"
                dt = task.scheduled_at
                import datetime as dt_module
                now_utc = dt_module.datetime.utcnow()
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=dt_module.timezone.utc)
                
                min_future = now_utc.replace(tzinfo=dt_module.timezone.utc) + dt_module.timedelta(minutes=16)
                if dt < min_future:
                    dt = min_future
                    
                status["publishAt"] = dt.strftime('%Y-%m-%dT%H:%M:%S.000Z')

            if getattr(task, "license", None):
                status["license"] = task.license

            request_body = {
                "snippet": snippet,
                "status": status
            }
            
            insert_parts = ["snippet", "status"]
            if recording_details:
                request_body["recordingDetails"] = recording_details
                insert_parts.append("recordingDetails")
                
            context.logger.info(f"[APIUploader] Payload to YouTube: {request_body}")

            # 3. Upload Video
            context.logger.info(f"[APIUploader] Starting video upload for task {task.id}")
            if not os.path.exists(task.video_path):
                return UploadResult(
                    success=False,
                    error_code="FILE_NOT_FOUND",
                    error_message=f"Video file not found: {task.video_path}"
                )

            media_file = MediaFileUpload(task.video_path, chunksize=10485760, resumable=True)
            is_private = status.get("privacyStatus") == "private"
            notify = False if is_private else getattr(task, "notify_subscribers", True)

            request = youtube.videos().insert(
                part=",".join(insert_parts),
                body=request_body,
                media_body=media_file,
                notifySubscribers=notify
            )
            
            response = None
            start_time = time.time()
            retries = 0
            while response is None:
                try:
                    upload_status, response = request.next_chunk()
                    if upload_status:
                        progress = int(upload_status.progress() * 100)
                        context.logger.info(f"[APIUploader] Upload Progress: {progress}%")
                        # Update DB with progress for frontend UI
                        if context.db_session and hasattr(context.task, 'upload_progress'):
                            context.task.upload_progress = progress
                            context.db_session.commit()
                    retries = 0 # reset on successful chunk
                except Exception as chunk_err:
                    import socket, httplib2
                    from googleapiclient.errors import HttpError
                    is_transient = isinstance(chunk_err, (socket.error, socket.timeout, TimeoutError, ConnectionError, httplib2.HttpLib2Error))
                    if isinstance(chunk_err, HttpError) and chunk_err.resp.status in [500, 502, 503, 504, 408]:
                        is_transient = True
                    
                    if is_transient and retries < 10:
                        retries += 1
                        wait_time = 2 ** retries
                        context.logger.warning(f"[APIUploader] Chunk network error ({chunk_err}). Retrying chunk in {wait_time}s (Attempt {retries}/10)...")
                        time.sleep(wait_time)
                    else:
                        raise chunk_err
            
            video_id = response["id"]
            youtube_url = f"https://youtube.com/watch?v={video_id}"
            context.logger.info(f"[APIUploader] Video uploaded successfully. ID: {video_id}")
            
            # 3.5 Force refresh token if expired during upload
            if credentials.expired or (credentials.expiry and credentials.expiry < datetime.datetime.utcnow() + datetime.timedelta(minutes=5)):
                context.logger.info("[APIUploader] Token might be expired after long upload. Refreshing credentials via RefreshService...")
                try:
                    from services.oauth_core.refresh_service import RefreshService
                    if not context.db_session:
                        from database.db import SessionLocal
                        db = SessionLocal()
                        try:
                            new_token = RefreshService.refresh(db, task.channel_id, token)
                        finally:
                            db.close()
                    else:
                        new_token = RefreshService.refresh(context.db_session, task.channel_id, token)
                        
                    # Rebuild credentials
                    config = OAuthClient.load_configuration(task.channel_id)
                    dt = datetime.datetime.fromisoformat(new_token.expires_at) if new_token.expires_at else None
                    credentials = Credentials(
                        token=new_token.access_token,
                        refresh_token=new_token.refresh_token,
                        token_uri=config.token_uri,
                        client_id=config.client_id,
                        client_secret=config.client_secret,
                        scopes=config.scopes,
                        expiry=dt
                    )
                    youtube = build("youtube", "v3", credentials=credentials)
                except Exception as ref_err:
                    context.logger.warning(f"[APIUploader] Token refresh failed: {ref_err}")
            
            # 4. Upload Thumbnail
            thumbnail_uploaded = False
            if task.thumbnail_path and os.path.exists(task.thumbnail_path):
                context.logger.info(f"[APIUploader] Uploading thumbnail...")
                try:
                    youtube.thumbnails().set(
                        videoId=video_id,
                        media_body=MediaFileUpload(task.thumbnail_path)
                    ).execute()
                    thumbnail_uploaded = True
                    context.logger.info(f"[APIUploader] Thumbnail uploaded.")
                except Exception as thumb_err:
                    context.logger.warning(f"[APIUploader] Thumbnail upload failed: {thumb_err}")
            
            # 5. Add to Playlist
            playlist_updated = False
            playlist_id = getattr(task, "playlist_id", None)
            if playlist_id:
                context.logger.info(f"[APIUploader] Adding to playlist {playlist_id}...")
                try:
                    youtube.playlistItems().insert(
                        part="snippet",
                        body={
                            "snippet": {
                                "playlistId": playlist_id,
                                "resourceId": {
                                    "kind": "youtube#video",
                                    "videoId": video_id
                                }
                            }
                        }
                    ).execute()
                    playlist_updated = True
                    context.logger.info(f"[APIUploader] Playlist updated.")
                except Exception as pl_err:
                    context.logger.warning(f"[APIUploader] Playlist assignment failed: {pl_err}")

            # 10. Verify Final Resource
            context.logger.info(f"[APIUploader] Verifying final resource for video {video_id}...")
            try:
                verify_response = youtube.videos().list(
                    part="id,status",
                    id=video_id
                ).execute()
                if not verify_response.get("items"):
                    raise Exception(f"Verification failed: Video {video_id} not found after upload.")
                context.logger.info("[APIUploader] Verification successful.")
            except Exception as v_err:
                context.logger.warning(f"[APIUploader] Verification step encountered an issue: {v_err}")

            # 11. Return UploadResult
            duration = time.time() - start_time
            
            return UploadResult(
                success=True,
                youtube_video_id=video_id,
                youtube_url=youtube_url,
                thumbnail_uploaded=thumbnail_uploaded,
                playlist_updated=playlist_updated,
                metadata_updated=True,
                upload_duration=duration,
                publish_state=status.get("privacyStatus"),
                scheduled_time=status.get("publishAt")
            )
            
        except Exception as e:
            import traceback
            context.logger.error(f"[APIUploader] Error: {e}\n{traceback.format_exc()}")
            return UploadResult(
                success=False,
                error_code="API_UPLOAD_ERROR",
                error_message=str(e) + "\n" + traceback.format_exc()
            )
