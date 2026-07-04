from optimizer.models import OptimizationCandidate

class ProposalValidator:
    def __init__(self, rules: dict):
        self.rules = rules

    def validate(self, candidate: OptimizationCandidate) -> bool:
        min_confidence = self.rules.get("minimum_confidence", 0.85)
        min_sample = self.rules.get("minimum_sample_size", 10)
        
        if candidate.evidence.confidence < min_confidence:
            return False
            
        if candidate.evidence.sample_size < min_sample:
            return False
            
        return True
