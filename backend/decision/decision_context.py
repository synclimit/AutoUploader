from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional

@dataclass(frozen=True)
class DecisionContext:
    session_id: str
    decision_id: str
    profile_version: str
    optimization_goal: str
    selected_candidate: str
    ranking: List[str]
    confidence: float
    reasoning: str
    runtime_ms: int
    warnings: List[str] = field(default_factory=list)
    fallback_used: bool = False
