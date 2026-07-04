import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, Any, Optional

@dataclass(frozen=True)
class BaseEvent:
    session_id: str
    correlation_id: str
    event_type: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    event_version: str = "1.0"
    event_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    category: str = "general"
    source: str = "backend"
    runtime_ms: int = 0
    
    def to_dict(self):
        return {
            "event_id": self.event_id,
            "event_version": self.event_version,
            "timestamp": self.timestamp,
            "session_id": self.session_id,
            "correlation_id": self.correlation_id,
            "event_type": self.event_type,
            "category": self.category,
            "source": self.source,
            "runtime_ms": self.runtime_ms,
            "metadata": self.metadata
        }

@dataclass(frozen=True)
class GenerationStarted(BaseEvent):
    event_type: str = "GenerationStarted"
    category: str = "generation"

@dataclass(frozen=True)
class GenerationCompleted(BaseEvent):
    event_type: str = "GenerationCompleted"
    category: str = "generation"

@dataclass(frozen=True)
class GenerationFailed(BaseEvent):
    event_type: str = "GenerationFailed"
    category: str = "generation"

@dataclass(frozen=True)
class MetadataEdited(BaseEvent):
    event_type: str = "MetadataEdited"
    category: str = "user_action"

@dataclass(frozen=True)
class MetadataApplied(BaseEvent):
    event_type: str = "MetadataApplied"
    category: str = "user_action"

@dataclass(frozen=True)
class MetadataSaved(BaseEvent):
    event_type: str = "MetadataSaved"
    category: str = "user_action"

@dataclass(frozen=True)
class UploadStarted(BaseEvent):
    event_type: str = "UploadStarted"
    category: str = "upload"

@dataclass(frozen=True)
class UploadCompleted(BaseEvent):
    event_type: str = "UploadCompleted"
    category: str = "upload"

@dataclass(frozen=True)
class KnowledgeStarted(BaseEvent):
    event_type: str = "KnowledgeStarted"
    category: str = "knowledge"

@dataclass(frozen=True)
class KnowledgeResolved(BaseEvent):
    event_type: str = "KnowledgeResolved"
    category: str = "knowledge"

@dataclass(frozen=True)
class KnowledgeFailed(BaseEvent):
    event_type: str = "KnowledgeFailed"
    category: str = "knowledge"

@dataclass(frozen=True)
class StrategyStarted(BaseEvent):
    event_type: str = "StrategyStarted"
    category: str = "strategy"

@dataclass(frozen=True)
class StrategyResolved(BaseEvent):
    event_type: str = "StrategyResolved"
    category: str = "strategy"

@dataclass(frozen=True)
class StrategyFailed(BaseEvent):
    event_type: str = "StrategyFailed"
    category: str = "strategy"

@dataclass(frozen=True)
class PromptCompilationStarted(BaseEvent):
    event_type: str = "PromptCompilationStarted"
    category: str = "prompt"

@dataclass(frozen=True)
class PromptCompiled(BaseEvent):
    event_type: str = "PromptCompiled"
    category: str = "prompt"

@dataclass(frozen=True)
class PromptCompilationFailed(BaseEvent):
    event_type: str = "PromptCompilationFailed"
    category: str = "prompt"

@dataclass(frozen=True)
class ProviderRequestStarted(BaseEvent):
    event_type: str = "ProviderRequestStarted"
    category: str = "provider"

@dataclass(frozen=True)
class ProviderRequestCompleted(BaseEvent):
    event_type: str = "ProviderRequestCompleted"
    category: str = "provider"

@dataclass(frozen=True)
class ProviderRequestFailed(BaseEvent):
    event_type: str = "ProviderRequestFailed"
    category: str = "provider"

@dataclass(frozen=True)
class PerformanceImported(BaseEvent):
    event_type: str = "PerformanceImported"
    category: str = "performance"

@dataclass(frozen=True)
class ReviewStarted(BaseEvent):
    event_type: str = "ReviewStarted"
    category: str = "review"

@dataclass(frozen=True)
class CandidateScored(BaseEvent):
    event_type: str = "CandidateScored"
    category: str = "review"

@dataclass(frozen=True)
class CandidateRejected(BaseEvent):
    event_type: str = "CandidateRejected"
    category: str = "review"

@dataclass(frozen=True)
class CandidateWinner(BaseEvent):
    event_type: str = "CandidateWinner"
    category: str = "review"

@dataclass(frozen=True)
class CandidateGenerated(BaseEvent):
    event_type: str = "CandidateGenerated"
    category: str = "review"

@dataclass(frozen=True)
class CandidateStored(BaseEvent):
    event_type: str = "CandidateStored"
    category: str = "review"

@dataclass(frozen=True)
class CandidateReviewed(BaseEvent):
    event_type: str = "CandidateReviewed"
    category: str = "review"

@dataclass(frozen=True)
class ReviewCompleted(BaseEvent):
    event_type: str = "ReviewCompleted"
    category: str = "review"

@dataclass(frozen=True)
class DecisionStarted(BaseEvent):
    event_type: str = "DecisionStarted"
    category: str = "decision"

@dataclass(frozen=True)
class DecisionProfileLoaded(BaseEvent):
    event_type: str = "DecisionProfileLoaded"
    category: str = "decision"

@dataclass(frozen=True)
class CandidateRanked(BaseEvent):
    event_type: str = "CandidateRanked"
    category: str = "decision"

@dataclass(frozen=True)
class WinnerSelected(BaseEvent):
    event_type: str = "WinnerSelected"
    category: str = "decision"

@dataclass(frozen=True)
class DecisionCompleted(BaseEvent):
    event_type: str = "DecisionCompleted"
    category: str = "decision"

@dataclass(frozen=True)
class FeedbackStarted(BaseEvent):
    event_type: str = "FeedbackStarted"
    category: str = "feedback"

@dataclass(frozen=True)
class FeedbackCollected(BaseEvent):
    event_type: str = "FeedbackCollected"
    category: str = "feedback"

@dataclass(frozen=True)
class ManualEditDetected(BaseEvent):
    event_type: str = "ManualEditDetected"
    category: str = "feedback"

@dataclass(frozen=True)
class UserOverrideDetected(BaseEvent):
    event_type: str = "UserOverrideDetected"
    category: str = "feedback"

@dataclass(frozen=True)
class FeedbackNormalized(BaseEvent):
    event_type: str = "FeedbackNormalized"
    category: str = "feedback"

@dataclass(frozen=True)
class FeedbackCompleted(BaseEvent):
    event_type: str = "FeedbackCompleted"
    category: str = "feedback"

@dataclass(frozen=True)
class OptimizerStarted(BaseEvent):
    event_type: str = "OptimizerStarted"
    category: str = "optimizer"

@dataclass(frozen=True)
class ProposalCreated(BaseEvent):
    event_type: str = "ProposalCreated"
    category: str = "optimizer"

@dataclass(frozen=True)
class ProposalValidated(BaseEvent):
    event_type: str = "ProposalValidated"
    category: str = "optimizer"

@dataclass(frozen=True)
class ProposalRejected(BaseEvent):
    event_type: str = "ProposalRejected"
    category: str = "optimizer"

@dataclass(frozen=True)
class ProposalApproved(BaseEvent):
    event_type: str = "ProposalApproved"
    category: str = "optimizer"

@dataclass(frozen=True)
class ExperimentStarted(BaseEvent):
    event_type: str = "ExperimentStarted"
    category: str = "optimizer"

@dataclass(frozen=True)
class ExperimentFinished(BaseEvent):
    event_type: str = "ExperimentFinished"
    category: str = "optimizer"

@dataclass(frozen=True)
class ProposalArchived(BaseEvent):
    event_type: str = "ProposalArchived"
    category: str = "optimizer"

@dataclass(frozen=True)
class ProposalPromoted(BaseEvent):
    event_type: str = "ProposalPromoted"
    category: str = "optimizer"

@dataclass(frozen=True)
class SandboxCreated(BaseEvent):
    event_type: str = "SandboxCreated"
    category: str = "experiment"

@dataclass(frozen=True)
class PatchApplied(BaseEvent):
    event_type: str = "PatchApplied"
    category: str = "experiment"

@dataclass(frozen=True)
class BenchmarkStarted(BaseEvent):
    event_type: str = "BenchmarkStarted"
    category: str = "experiment"

@dataclass(frozen=True)
class BenchmarkCompleted(BaseEvent):
    event_type: str = "BenchmarkCompleted"
    category: str = "experiment"

@dataclass(frozen=True)
class RegressionStarted(BaseEvent):
    event_type: str = "RegressionStarted"
    category: str = "experiment"

@dataclass(frozen=True)
class RegressionCompleted(BaseEvent):
    event_type: str = "RegressionCompleted"
    category: str = "experiment"

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




