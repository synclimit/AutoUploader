import os
import pickle
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
            from services.system.path_service import PathService
            token_pickle = os.path.join(PathService.get_appdata_dir(), "tokens", "accounts", f"{task.account_id}.pickle")
            
            if not os.path.exists(token_pickle):
                return UploadResult(
                    success=False,
                    error_code="AUTH_REQUIRED",
                    error_message=f"OAuth token not found for account {task.account_id}. Please connect YouTube."
                )
                
            with open(token_pickle, "rb") as token:
                credentials = pickle.load(token)
                
            youtube = build("youtube", "v3", credentials=credentials)
            
            # 2. Prepare Video Metadata
            snippet = {
                "title": task.title or "Untitled Upload",
                "description": task.description or "Uploaded via AutoUploader",
                "categoryId": str(task.category_id) if getattr(task, "category_id", None) else "22"
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
            
            if getattr(task, "ai_use", "UNKNOWN") != "UNKNOWN":
                context.logger.info(f"[APIUploader] Skipping unsupported YouTube Data API field: ai_use={task.ai_use}")
            
            recording_details = {}
            if getattr(task, "recording_date", None):
                dt = task.recording_date
                if dt.tzinfo is None:
                    dt = dt.replace(tzinfo=datetime.timezone.utc)
                recording_details["recordingDate"] = dt.isoformat()
            
            # Scheduling Support
            if task.privacy_status == "private" and getattr(task, "scheduled_at", None):
                # YouTube API requires publishAt to be in ISO 8601 format with timezone, and privacyStatus must be 'private'
                # Also, it must be at least 15 minutes in the future!
                dt = task.scheduled_at
                import datetime as dt_module
                now_utc = dt_module.datetime.utcnow()
                if dt > now_utc:
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=dt_module.timezone.utc)
                    
                    min_future = now_utc.replace(tzinfo=dt_module.timezone.utc) + dt_module.timedelta(minutes=16)
                    if dt < min_future:
                        dt = min_future
                        
                    status["publishAt"] = dt.isoformat()

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
            # Use 10MB chunks (1024 * 1024 * 10) instead of -1 (full file) to allow progress updates and avoid timeouts
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
            while response is None:
                upload_status, response = request.next_chunk()
                if upload_status:
                    progress = int(upload_status.progress() * 100)
                    context.logger.info(f"[APIUploader] Upload Progress: {progress}%")
                    # Update DB with progress for frontend UI
                    if context.db_session and hasattr(context.task, 'upload_progress'):
                        context.task.upload_progress = progress
                        context.db_session.commit()
            
            video_id = response["id"]
            youtube_url = f"https://youtube.com/watch?v={video_id}"
            context.logger.info(f"[APIUploader] Video uploaded successfully. ID: {video_id}")
            
            # 3.5 Force refresh token if expired during upload
            if credentials.expired or (credentials.expiry and credentials.expiry < datetime.datetime.utcnow() + datetime.timedelta(minutes=5)):
                context.logger.info("[APIUploader] Token might be expired after long upload. Refreshing credentials...")
                try:
                    from google.auth.transport.requests import Request
                    credentials.refresh(Request())
                    with open(token_pickle, "wb") as token:
                        pickle.dump(credentials, token)
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
