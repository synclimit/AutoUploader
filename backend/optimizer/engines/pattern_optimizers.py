from typing import List
import uuid
from learning.models import LearningFinding
from optimizer.models import OptimizationCandidate, ProposalEvidence

class BaseOptimizer:
    def optimize(self, finding: LearningFinding) -> OptimizationCandidate:
        raise NotImplementedError

class StrategyOptimizer(BaseOptimizer):
    def optimize(self, finding: LearningFinding) -> OptimizationCandidate:
        # Converts a finding into an optimization candidate
        # e.g. "Repeated user edits detected." -> "Test CTA Strategy B"
        proposed_change = "Update Strategy Rule"
        if "edit" in finding.observation.lower():
            proposed_change = "Reduce Content Length Target"
        elif "performance" in finding.observation.lower():
            proposed_change = "Adjust Optimization Goal"
            
        evidence = ProposalEvidence(
            finding_id=finding.finding_id,
            sample_size=finding.evidence,
            confidence=finding.confidence,
            observation=finding.observation
        )
        
        return OptimizationCandidate(
            candidate_id=f"OPT-{uuid.uuid4().hex[:6].upper()}",
            target_layer=finding.target_layer,
            target_component=finding.target_component,
            proposed_change=proposed_change,
            evidence=evidence
        )

class PromptOptimizer(BaseOptimizer):
    def optimize(self, finding: LearningFinding) -> OptimizationCandidate:
        evidence = ProposalEvidence(
            finding_id=finding.finding_id,
            sample_size=finding.evidence,
            confidence=finding.confidence,
            observation=finding.observation
        )
        return OptimizationCandidate(
            candidate_id=f"OPT-{uuid.uuid4().hex[:6].upper()}",
            target_layer=finding.target_layer,
            target_component=finding.target_component,
            proposed_change="Create Prompt v2 Experiment",
            evidence=evidence
        )
