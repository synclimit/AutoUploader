from dataclasses import dataclass, field
from typing import List, Dict, Optional
from enum import Enum

class ExperimentStatus(Enum):
    PENDING = "Pending"
    SANDBOX_CREATED = "Sandbox Created"
    PATCHING = "Patching"
    BENCHMARKING = "Benchmarking"
    REGRESSION = "Regression Analysis"
    PASSED = "Passed"
    FAILED = "Failed"
    ERROR = "Error"
    PROMOTED = "Promoted"

@dataclass(frozen=True)
class BenchmarkSnapshot:
    dataset_name: str
    total_samples: int
    pass_count: int
    fail_count: int
    warning_count: int
    average_latency_ms: int

@dataclass(frozen=True)
class RegressionSnapshot:
    baseline_acceptance_rate: float
    sandbox_acceptance_rate: float
    baseline_latency_ms: int
    sandbox_latency_ms: int
    improvements: List[str]
    regressions: List[str]

@dataclass(frozen=True)
class ExperimentMetrics:
    acceptance_rate: float
    avg_review_score: float
    avg_decision_score: float
    cost_estimation: float

@dataclass(frozen=True)
class ExperimentComparison:
    is_improvement: bool
    confidence_score: float
    details: str

@dataclass(frozen=True)
class ExperimentCandidate:
    candidate_id: str
    target_layer: str
    proposed_change: str

@dataclass(frozen=True)
class ExperimentResult:
    experiment_id: str
    proposal_id: str
    plan_id: str
    candidate: ExperimentCandidate
    metrics: ExperimentMetrics
    regression: RegressionSnapshot
    comparison: ExperimentComparison
    status: ExperimentStatus
    promotion_recommended: bool
    timestamp: str

@dataclass(frozen=True)
class ExperimentRun:
    run_id: str
    sandbox_id: str
    benchmark: BenchmarkSnapshot
    result: ExperimentResult

@dataclass(frozen=True)
class ExperimentContext:
    session_id: str
    plan_id: str
    runs: List[ExperimentRun]
    runtime_ms: int
