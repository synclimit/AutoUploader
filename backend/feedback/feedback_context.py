from dataclasses import dataclass, field
from typing import List, Optional

@dataclass(frozen=True)
class FeedbackContext:
    session_id: str
    feedback_id: str
    candidate_id: str
    decision_profile: str
    winner: str
    user_selection: Optional[str]
    user_override: bool
    manual_edits: dict
    edit_distance: float
    upload_status: Optional[str]
    performance_status: dict
    feedback_score: float
    confidence: float
    warnings: List[str] = field(default_factory=list)
    fallback_used: bool = False
    runtime_ms: int = 0
    timestamp: str = ""
