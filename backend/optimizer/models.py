from dataclasses import dataclass
from typing import List, Optional
from enum import Enum

class ProposalStatus(Enum):
    DRAFT = "Draft"
    READY = "Ready"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    ARCHIVED = "Archived"
    SUPERSEDED = "Superseded"
    EXPIRED = "Expired"

class ProposalPriority(Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"

@dataclass(frozen=True)
class ProposalRisk:
    score: float
    factors: List[str]

@dataclass(frozen=True)
class ProposalImpact:
    expected_improvement: str
    affected_metrics: List[str]
    score: float

@dataclass(frozen=True)
class ProposalEvidence:
    finding_id: str
    sample_size: int
    confidence: float
    observation: str

@dataclass(frozen=True)
class OptimizationCandidate:
    candidate_id: str
    target_layer: str
    target_component: str
    proposed_change: str
    evidence: ProposalEvidence

@dataclass(frozen=True)
class ImprovementProposal:
    proposal_id: str
    candidate: OptimizationCandidate
    priority: ProposalPriority
    risk: ProposalRisk
    impact: ProposalImpact
    status: ProposalStatus
    timestamp: str

@dataclass(frozen=True)
class ProposalBatch:
    batch_id: str
    proposals: List[ImprovementProposal]
    timestamp: str

@dataclass(frozen=True)
class OptimizerContext:
    session_id: str
    profile_version: str
    batch: ProposalBatch
    runtime_ms: int
