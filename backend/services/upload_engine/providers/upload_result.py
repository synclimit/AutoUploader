from dataclasses import dataclass
from typing import Optional

@dataclass(frozen=True)
class UploadResult:
    success: bool
    youtube_video_id: Optional[str] = None
    youtube_url: Optional[str] = None
    visibility: Optional[str] = None
    publish_state: Optional[str] = None
    upload_duration: float = 0.0
    thumbnail_uploaded: bool = False
    playlist_updated: bool = False
    metadata_updated: bool = False
    scheduled_time: Optional[str] = None
    steps_completed: int = 0
    failed_step: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
