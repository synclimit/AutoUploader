from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum

class ChangeAction(Enum):
    CREATE_VERSION = "CREATE_VERSION"
    PATCH_VALUE = "PATCH_VALUE"
    UPDATE_MANIFEST = "UPDATE_MANIFEST"
    DELETE_VERSION = "DELETE_VERSION"
    RESTORE_ALIAS = "RESTORE_ALIAS"

class ChangeTarget(Enum):
    STRATEGY = "Strategy"
    PROMPT = "Prompt"
    KNOWLEDGE = "Knowledge"
    DECISION = "Decision"

@dataclass(frozen=True)
class ChangePatch:
    operation: str
    path: str
    current_value: str
    new_value: str

@dataclass(frozen=True)
class ChangeMigration:
    source_version: str
    destination_version: str
    operations: List[str]

@dataclass(frozen=True)
class ChangeRollback:
    operations: List[str]

@dataclass(frozen=True)
class ChangeDependency:
    registry: str
    required_version: str

@dataclass(frozen=True)
class ChangeRisk:
    level: str
    factors: List[str]

@dataclass(frozen=True)
class ChangeValidation:
    is_valid: bool
    errors: List[str]

@dataclass(frozen=True)
class ChangePlan:
    plan_id: str
    proposal_id: str
    target: ChangeTarget
    actions: List[ChangeAction]
    dependencies: List[ChangeDependency]
    patches: List[ChangePatch]
    migration: ChangeMigration
    rollback: ChangeRollback
    risk: ChangeRisk
    validation: ChangeValidation
    timestamp: str

@dataclass(frozen=True)
class ChangeContext:
    session_id: str
    plan: ChangePlan
    runtime_ms: int
