import os
import json
import uuid
import time
import datetime
from learning.models import LearningReport
from optimizer.models import OptimizerContext, ProposalBatch
from optimizer.engines.pattern_optimizers import StrategyOptimizer, PromptOptimizer
from optimizer.proposal_validator import ProposalValidator
from optimizer.proposal_prioritizer import ProposalPrioritizer
from telemetry.session_manager import SessionManager
from telemetry.event_bus import EventBus
from telemetry.events import OptimizerStarted, ProposalCreated, ProposalValidated

class ProposalBuilder:
    def __init__(self, registry_dir: str):
        self.registry_dir = registry_dir
        self.engines = [
            StrategyOptimizer(),
            PromptOptimizer()
        ]

    def load_profile(self, category: str, version: str) -> dict:
        profile_path = os.path.join(self.registry_dir, category, version, "optimizer.json")
        with open(profile_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def build_proposals(self, session_id: str, report: LearningReport, category: str, version: str) -> OptimizerContext:
        start_time = time.time()
        _, corr_id = SessionManager.get_session()
        EventBus.publish(OptimizerStarted(session_id, corr_id))
        
        rules = self.load_profile(category, version)
        validator = ProposalValidator(rules)
        prioritizer = ProposalPrioritizer(rules)
        
        valid_proposals = []
        
        for finding in report.findings:
            # Send finding to appropriate engine
            candidate = None
            if finding.target_layer == "Strategy":
                candidate = StrategyOptimizer().optimize(finding)
            else:
                candidate = PromptOptimizer().optimize(finding)
                
            # Validate candidate
            if validator.validate(candidate):
                EventBus.publish(ProposalValidated(session_id, corr_id, metadata={"candidate_id": candidate.candidate_id}))
                
                # Prioritize and build ImprovementProposal
                proposal = prioritizer.prioritize(candidate)
                valid_proposals.append(proposal)
                
                EventBus.publish(ProposalCreated(session_id, corr_id, metadata={"proposal_id": proposal.proposal_id, "status": proposal.status.value}))
                
        batch = ProposalBatch(
            batch_id=f"BATCH-{uuid.uuid4().hex[:6].upper()}",
            proposals=valid_proposals,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
        return OptimizerContext(
            session_id=session_id,
            profile_version=f"{category}/{version}",
            batch=batch,
            runtime_ms=int((time.time() - start_time) * 1000)
        )
