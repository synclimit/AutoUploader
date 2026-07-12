from dataclasses import dataclass
from typing import Optional
from datetime import datetime
from .upload_state_machine import UploadState

@dataclass
class UploadProgress:
    status: UploadState
    progress_percentage: float
    bytes_uploaded: int
    speed_bps: float
    started_at: Optional[datetime]
    estimated_finish: Optional[datetime]
    message: str
