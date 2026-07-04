import os
import json
import uuid
import time
import datetime
from change_planner.models import ChangePlan
from experiments.models import (
    ExperimentContext, ExperimentRun, ExperimentCandidate, ExperimentMetrics, 
    ExperimentComparison, ExperimentResult, ExperimentStatus
)
from experiments.sandbox_manager import SandboxManager
from experiments.patch_executor import PatchExecutor
from experiments.benchmark_runner import BenchmarkRunner
from experiments.regression_engine import RegressionEngine
from telemetry.session_manager import SessionManager
from telemetry.event_bus import EventBus
from telemetry.events import BaseEvent
from dataclasses import dataclass

@dataclass(frozen=True)
class ExperimentStarted(BaseEvent):
    event_type: str = "ExperimentStarted"
    category: str = "experiment"

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
class ExperimentFinished(BaseEvent):
    event_type: str = "ExperimentFinished"
    category: str = "experiment"

class ExperimentResultBuilder:
    def __init__(self, registry_dir: str):
        self.registry_dir = registry_dir
        self.sandbox_manager = SandboxManager()
        self.patch_executor = PatchExecutor(self.sandbox_manager)
        self.benchmark_runner = BenchmarkRunner()
        self.regression_engine = RegressionEngine()

    def build_result(self, session_id: str, plan: ChangePlan, category: str, version: str) -> ExperimentContext:
        start_time = time.time()
        _, corr_id = SessionManager.get_session()
        EventBus.publish(ExperimentStarted(session_id, corr_id))
        
        sandbox_id = self.sandbox_manager.create_sandbox()
        EventBus.publish(SandboxCreated(session_id, corr_id))
        
        # Clone registries based on dependencies
        for dep in plan.dependencies:
            self.sandbox_manager.clone_registry(sandbox_id, dep.registry, dep.required_version)
            
        # Apply patches
        self.patch_executor.apply_patches(sandbox_id, plan.patches)
        EventBus.publish(PatchApplied(session_id, corr_id))
        
        # Run benchmark
        EventBus.publish(BenchmarkStarted(session_id, corr_id))
        benchmark_snapshot = self.benchmark_runner.run(sandbox_id, "golden_100_keywords_v2")
        EventBus.publish(BenchmarkCompleted(session_id, corr_id))
        
        # Run regression
        EventBus.publish(RegressionStarted(session_id, corr_id))
        baseline = {"acceptance_rate": 0.85, "latency_ms": 1500}
        regression = self.regression_engine.analyze(baseline, benchmark_snapshot)
        EventBus.publish(RegressionCompleted(session_id, corr_id))
        
        # Construct metrics and result
        metrics = ExperimentMetrics(
            acceptance_rate=regression.sandbox_acceptance_rate,
            avg_review_score=92.0,
            avg_decision_score=0.94,
            cost_estimation=1.05
        )
        
        is_improvement = len(regression.improvements) > len(regression.regressions)
        comparison = ExperimentComparison(
            is_improvement=is_improvement,
            confidence_score=0.91 if is_improvement else 0.4,
            details="Sandbox showed noticeable improvements" if is_improvement else "Sandbox degraded metrics"
        )
        
        candidate = ExperimentCandidate(
            candidate_id=plan.plan_id,
            target_layer=plan.target.value,
            proposed_change="Simulated Change"
        )
        
        result = ExperimentResult(
            experiment_id=f"EXP-{uuid.uuid4().hex[:6].upper()}",
            proposal_id=plan.proposal_id,
            plan_id=plan.plan_id,
            candidate=candidate,
            metrics=metrics,
            regression=regression,
            comparison=comparison,
            status=ExperimentStatus.PASSED if is_improvement else ExperimentStatus.FAILED,
            promotion_recommended=is_improvement,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
        run = ExperimentRun(
            run_id=f"RUN-{uuid.uuid4().hex[:6].upper()}",
            sandbox_id=sandbox_id,
            benchmark=benchmark_snapshot,
            result=result
        )
        
        self.sandbox_manager.destroy_sandbox(sandbox_id)
        EventBus.publish(ExperimentFinished(session_id, corr_id))
        
        return ExperimentContext(
            session_id=session_id,
            plan_id=plan.plan_id,
            runs=[run],
            runtime_ms=int((time.time() - start_time) * 1000)
        )
