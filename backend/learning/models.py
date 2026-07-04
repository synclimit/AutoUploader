from dataclasses import dataclass
from typing import List, Optional

@dataclass(frozen=True)
class LearningFinding:
    finding_id: str
    target_layer: str
    target_component: str
    observation: str
    frequency: float
    confidence: float
    evidence: int
    timestamp: str

@dataclass(frozen=True)
class LearningReport:
    report_id: str
    profile_version: str
    sample_size: int
    findings: List[LearningFinding]
    timestamp: str

@dataclass(frozen=True)
class LearningContext:
    session_id: str
    feedback_packages_count: int
    profile_version: str
    reports: List[LearningReport]
    runtime_ms: int
