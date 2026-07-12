import os
import time
from datetime import datetime
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2.credentials import Credentials
from googleapiclient.errors import HttpError

from services.oauth_core import OAuthToken, OAuthClient
from .upload_types import UploadRequest
from .upload_progress import UploadProgress
from .upload_state_machine import UploadState
from .upload_result import UploadResult
from .upload_exceptions import UploadFailed, QuotaExceeded, NetworkFailure

class UploadSession:
    """
    Tanggung jawab:
    Melakukan eksekusi upload menggunakan Google API Client.
    Mengirimkan yield progress ke UploadManager.
    """
    
    def __init__(self, channel_id: str, token: OAuthToken, request: UploadRequest):
        self.channel_id = channel_id
        self.token = token
        self.request = request
        self.started_at = None
        
    def _build_credentials(self) -> Credentials:
        config = OAuthClient.load_configuration(self.channel_id)
        return Credentials(
            token=self.token.access_token,
            refresh_token=self.token.refresh_token,
            token_uri=config.token_uri,
            client_id=config.client_id,
            client_secret=config.client_secret
        )

    def execute(self):
        self.started_at = datetime.utcnow()
        creds = self._build_credentials()
        
        try:
            youtube = build("youtube", "v3", credentials=creds)
            
            body = {
                "snippet": {
                    "title": self.request.metadata.title,
                    "description": self.request.metadata.description,
                    "tags": self.request.metadata.tags,
                    "categoryId": self.request.metadata.category_id
                },
                "status": {
                    "privacyStatus": self.request.metadata.privacy_status
                }
            }
            
            media_body = MediaFileUpload(
                self.request.video_path, 
                chunksize=-1, 
                resumable=True
            )
            
            insert_request = youtube.videos().insert(
                part="snippet,status",
                body=body,
                media_body=media_body
            )
            
            response = None
            total_bytes = os.path.getsize(self.request.video_path)
            
            yield UploadProgress(
                status=UploadState.UPLOADING,
                progress_percentage=0.0,
                bytes_uploaded=0,
                speed_bps=0.0,
                started_at=self.started_at,
                estimated_finish=None,
                message="Starting upload"
            )

            # In a real environment, we'd chunk it. Here we just execute and mock progress for testing.
            # But let's write real chunking logic that googleapiclient supports via next_chunk()
            last_time = time.time()
            
            while response is None:
                status, response = insert_request.next_chunk()
                if status:
                    progress = int(status.progress() * 100)
                    now = time.time()
                    elapsed = now - last_time
                    speed = (status.resumable_progress) / elapsed if elapsed > 0 else 0
                    
                    yield UploadProgress(
                        status=UploadState.UPLOADING,
                        progress_percentage=progress,
                        bytes_uploaded=status.resumable_progress,
                        speed_bps=speed,
                        started_at=self.started_at,
                        estimated_finish=None,
                        message=f"Uploading... {progress}%"
                    )

            video_id = response.get("id")
            
            # Optional: Upload Thumbnail if provided
            if self.request.thumbnail_path and video_id:
                yield UploadProgress(
                    status=UploadState.PROCESSING,
                    progress_percentage=95.0,
                    bytes_uploaded=total_bytes,
                    speed_bps=0.0,
                    started_at=self.started_at,
                    estimated_finish=None,
                    message="Uploading thumbnail"
                )
                youtube.thumbnails().set(
                    videoId=video_id,
                    media_body=MediaFileUpload(self.request.thumbnail_path)
                ).execute()
            
            yield UploadResult(
                success=True,
                video_id=video_id,
                error_code=None,
                error_message=None,
                started_at=self.started_at,
                finished_at=datetime.utcnow(),
                elapsed_time_seconds=(datetime.utcnow() - self.started_at).total_seconds()
            )

        except HttpError as e:
            if "quotaExceeded" in str(e):
                raise QuotaExceeded("YouTube Quota Exceeded")
            else:
                raise UploadFailed(f"HTTP Error during upload: {e}")
        except Exception as e:
            raise NetworkFailure(f"Network or internal failure during upload: {e}")
