from dataclasses import dataclass
from typing import Optional
from datetime import datetime

@dataclass
class UploadResult:
    success: bool
    video_id: Optional[str]
    error_code: Optional[str]
    error_message: Optional[str]
    started_at: datetime
    finished_at: datetime
    elapsed_time_seconds: float
