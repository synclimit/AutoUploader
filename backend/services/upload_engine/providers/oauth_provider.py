import os
import pickle
import time
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from .base_provider import BaseUploader
from .upload_context import UploadContext
from .upload_result import UploadResult

class OAuthUploader(BaseUploader):
    def upload(self, context: UploadContext) -> UploadResult:
        task = context.task
        
        try:
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
            
            request_body = {
                "snippet": {
                    "title": task.title or "Untitled Upload",
                    "description": task.description or "Uploaded via AutoUploader",
                    "categoryId": "22"
                },
                "status": {
                    "privacyStatus": task.privacy_status or "private",
                    "selfDeclaredMadeForKids": task.made_for_kids if task.made_for_kids is not None else False
                }
            }
            if task.tags:
                request_body["snippet"]["tags"] = [tag.strip() for tag in task.tags.split(",") if tag.strip()]
            
            media_file = MediaFileUpload(task.video_path, chunksize=-1, resumable=True)
                
            request = youtube.videos().insert(
                part="snippet,status",
                body=request_body,
                media_body=media_file
            )
            
            response = None
            start_time = time.time()
            while response is None:
                status, response = request.next_chunk()
                if status:
                    progress = int(status.progress() * 100)
                    context.logger.info(f"[OAuthUploader] Upload Progress: {progress}%")
            
            video_id = response["id"]
            youtube_url = f"https://youtube.com/watch?v={video_id}"
            
            thumbnail_uploaded = False
            if task.thumbnail_path and os.path.exists(task.thumbnail_path):
                context.logger.info(f"[OAuthUploader] Uploading thumbnail for task {task.id}")
                youtube.thumbnails().set(
                    videoId=video_id,
                    media_body=MediaFileUpload(task.thumbnail_path)
                ).execute()
                thumbnail_uploaded = True
                
            duration = time.time() - start_time
            
            return UploadResult(
                success=True,
                youtube_video_id=video_id,
                youtube_url=youtube_url,
                thumbnail_uploaded=thumbnail_uploaded,
                metadata_updated=True,
                upload_duration=duration
            )
            
        except Exception as e:
            import traceback
            return UploadResult(
                success=False,
                error_code="OAUTH_UPLOAD_ERROR",
                error_message=str(e) + "\n" + traceback.format_exc()
            )
