from dataclasses import dataclass
from typing import Optional

@dataclass
class StepResult:
    success: bool
    duration: float = 0.0
    retries: int = 0
    screenshot_before: Optional[str] = None
    screenshot_after: Optional[str] = None
    screenshot_failed: Optional[str] = None
    message: str = ""
