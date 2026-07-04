import os
import json
import uuid
import time
import datetime
from experiments.models import ExperimentResult
from promotion.models import (
    PromotionContext, PromotionCandidate, PromotionPlan, PromotionResult,
    PromotionHistory, ProductionAlias, PromotionStatus, PromotionValidation, PromotionRollback
)
from promotion.promotion_validator import PromotionValidator
from promotion.alias_manager import AliasManager
from promotion.registry_promotion import RegistryPromotion
from promotion.promotion_history import PromotionHistoryLogger
from telemetry.session_manager import SessionManager
from telemetry.event_bus import EventBus
from telemetry.events import BaseEvent
from dataclasses import dataclass

@dataclass(frozen=True)
class PromotionStarted(BaseEvent):
    event_type: str = "PromotionStarted"
    category: str = "promotion"

@dataclass(frozen=True)
class PromotionValidated(BaseEvent):
    event_type: str = "PromotionValidated"
    category: str = "promotion"

@dataclass(frozen=True)
class AliasUpdated(BaseEvent):
    event_type: str = "AliasUpdated"
    category: str = "promotion"

@dataclass(frozen=True)
class RegistryPromoted(BaseEvent):
    event_type: str = "RegistryPromoted"
    category: str = "promotion"

@dataclass(frozen=True)
class PromotionCompleted(BaseEvent):
    event_type: str = "PromotionCompleted"
    category: str = "promotion"

@dataclass(frozen=True)
class RollbackSnapshotCreated(BaseEvent):
    event_type: str = "RollbackSnapshotCreated"
    category: str = "promotion"


class PromotionBuilder:
    def __init__(self, registry_dir: str):
        self.registry_dir = registry_dir
        self.alias_manager = AliasManager()
        self.registry_promotion = RegistryPromotion()
        self.history_logger = PromotionHistoryLogger("promotion_history.log")

    def load_profile(self, category: str, version: str) -> dict:
        profile_path = os.path.join(self.registry_dir, category, version, "promotion.json")
        with open(profile_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def promote(self, session_id: str, experiment_result: ExperimentResult, human_approved: bool, category: str, version: str, operator: str) -> PromotionContext:
        start_time = time.time()
        _, corr_id = SessionManager.get_session()
        EventBus.publish(PromotionStarted(session_id, corr_id))
        
        rules = self.load_profile(category, version)
        validator = PromotionValidator(rules)
        
        validation = validator.validate(experiment_result, human_approved)
        EventBus.publish(PromotionValidated(session_id, corr_id, metadata={"is_valid": validation.is_valid}))
        
        target = experiment_result.candidate.target_layer
        dest_version = "v2" # Mocking next version logic
        
        candidate = PromotionCandidate(
            experiment_id=experiment_result.experiment_id,
            proposal_id=experiment_result.proposal_id,
            target_registry=target,
            source_sandbox_version="sandbox_v1",
            destination_production_version=dest_version
        )
        
        alias = ProductionAlias(
            registry=target,
            alias_name="production",
            points_to_version=dest_version
        )
        
        plan = PromotionPlan(
            plan_id=f"PPLN-{uuid.uuid4().hex[:6].upper()}",
            candidate=candidate,
            aliases_to_update=[alias],
            requires_human_approval=True
        )
        
        status = PromotionStatus.REJECTED
        history_record = None
        rollback = None
        
        if validation.is_valid:
            # Create Rollback snapshot
            rollback = PromotionRollback(
                snapshot_id=f"RB-{uuid.uuid4().hex[:6].upper()}",
                target_registry=target,
                previous_version="v1",
                restore_commands=["Revert Alias"]
            )
            EventBus.publish(RollbackSnapshotCreated(session_id, corr_id))
            
            # Promote Assets
            self.registry_promotion.promote_assets(target, "sandbox_v1", dest_version)
            EventBus.publish(RegistryPromoted(session_id, corr_id))
            
            # Update Aliases
            self.alias_manager.update_aliases(plan.aliases_to_update)
            EventBus.publish(AliasUpdated(session_id, corr_id))
            
            # Record History
            history_record = PromotionHistory(
                history_id=f"PH-{uuid.uuid4().hex[:6].upper()}",
                experiment_id=experiment_result.experiment_id,
                proposal_id=experiment_result.proposal_id,
                operator=operator,
                target_registry=target,
                previous_version="v1",
                new_version=dest_version,
                rollback_snapshot_id=rollback.snapshot_id,
                timestamp=datetime.datetime.utcnow().isoformat()
            )
            self.history_logger.record(history_record)
            
            status = PromotionStatus.PROMOTED
            
        result = PromotionResult(
            promotion_id=f"PRM-{uuid.uuid4().hex[:6].upper()}",
            plan=plan,
            status=status,
            validation=validation,
            history_record=history_record,
            rollback=rollback,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
        EventBus.publish(PromotionCompleted(session_id, corr_id))
        
        return PromotionContext(
            session_id=session_id,
            results=[result],
            runtime_ms=int((time.time() - start_time) * 1000)
        )
