from dataclasses import dataclass
from typing import Any
from logging import Logger

@dataclass(frozen=True)
class UploadContext:
    task: Any          # UploadTask instance
    account: Any       # Account instance
    profile: Any       # Profile instance
    browser_profile_path: str
    db_session: Any    # Session instance
    logger: Logger
    settings: dict
