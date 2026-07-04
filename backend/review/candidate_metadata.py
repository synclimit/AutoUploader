from dataclasses import dataclass
from typing import Dict, Any

@dataclass(frozen=True)
class CandidateMetadata:
    candidate_id: str
    session_id: str
    title: str
    description: str
    tags: str
    provider: str
    model: str
    prompt_version: str
    knowledge_version: str
    strategy_version: str
    generation_runtime_ms: int
    raw_response: Dict[str, Any]
    confidence: float
