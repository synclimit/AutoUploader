from dataclasses import dataclass
from typing import Optional, List

@dataclass
class UploadMetadata:
    title: str
    description: str
    tags: List[str]
    category_id: str
    privacy_status: str

@dataclass
class UploadRequest:
    task_id: str
    channel_id: str
    video_path: str
    thumbnail_path: Optional[str]
    metadata: UploadMetadata
