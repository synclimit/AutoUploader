from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum

class PromotionStatus(Enum):
    PENDING = "Pending"
    VALIDATED = "Validated"
    REJECTED = "Rejected"
    ALIAS_UPDATED = "Alias Updated"
    PROMOTED = "Promoted"
    FAILED = "Failed"

@dataclass(frozen=True)
class PromotionValidation:
    is_valid: bool
    errors: List[str]

@dataclass(frozen=True)
class PromotionCandidate:
    experiment_id: str
    proposal_id: str
    target_registry: str
    source_sandbox_version: str
    destination_production_version: str

@dataclass(frozen=True)
class ProductionAlias:
    registry: str
    alias_name: str
    points_to_version: str

@dataclass(frozen=True)
class PromotionRollback:
    snapshot_id: str
    target_registry: str
    previous_version: str
    restore_commands: List[str]

@dataclass(frozen=True)
class PromotionPlan:
    plan_id: str
    candidate: PromotionCandidate
    aliases_to_update: List[ProductionAlias]
    requires_human_approval: bool

@dataclass(frozen=True)
class PromotionHistory:
    history_id: str
    experiment_id: str
    proposal_id: str
    operator: str
    target_registry: str
    previous_version: str
    new_version: str
    rollback_snapshot_id: str
    timestamp: str

@dataclass(frozen=True)
class PromotionResult:
    promotion_id: str
    plan: PromotionPlan
    status: PromotionStatus
    validation: PromotionValidation
    history_record: Optional[PromotionHistory]
    rollback: Optional[PromotionRollback]
    timestamp: str

@dataclass(frozen=True)
class PromotionContext:
    session_id: str
    results: List[PromotionResult]
    runtime_ms: int
