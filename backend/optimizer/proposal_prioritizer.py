import uuid
import datetime
from optimizer.models import OptimizationCandidate, ImprovementProposal, ProposalPriority, ProposalRisk, ProposalImpact, ProposalStatus

class ProposalPrioritizer:
    def __init__(self, rules: dict):
        self.rules = rules

    def prioritize(self, candidate: OptimizationCandidate) -> ImprovementProposal:
        # Determine priority based on registry rules
        priority_str = self.rules.get("proposal_priority", {}).get(candidate.target_layer, "Medium")
        priority = ProposalPriority[priority_str.upper()]
        
        # Determine risk
        risk = ProposalRisk(score=0.2, factors=["Minor logic change"])
        
        # Determine impact
        impact = ProposalImpact(
            expected_improvement="+5%",
            affected_metrics=["Acceptance Rate"],
            score=7.5
        )
        
        return ImprovementProposal(
            proposal_id=f"PROP-{uuid.uuid4().hex[:6].upper()}",
            candidate=candidate,
            priority=priority,
            risk=risk,
            impact=impact,
            status=ProposalStatus.DRAFT,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
