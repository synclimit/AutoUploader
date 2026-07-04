from experiments.models import ExperimentResult, ExperimentStatus
from promotion.models import PromotionValidation

class PromotionValidator:
    def __init__(self, rules: dict):
        self.rules = rules

    def validate(self, experiment_result: ExperimentResult, human_approved: bool) -> PromotionValidation:
        errors = []
        
        req_human = self.rules.get("approval_rules", {}).get("require_human_approval", True)
        req_pass = self.rules.get("approval_rules", {}).get("require_experiment_passed", True)
        min_conf = self.rules.get("approval_rules", {}).get("minimum_confidence", 0.85)
        
        if req_human and not human_approved:
            errors.append("Human approval is required but missing.")
            
        if req_pass and experiment_result.status != ExperimentStatus.PASSED:
            errors.append(f"Experiment status is {experiment_result.status.value}, requires PASSED.")
            
        if experiment_result.comparison.confidence_score < min_conf:
            errors.append(f"Confidence score {experiment_result.comparison.confidence_score} is below minimum {min_conf}.")
            
        if not experiment_result.promotion_recommended:
            errors.append("Experiment Runner did not recommend promotion.")
            
        return PromotionValidation(
            is_valid=len(errors) == 0,
            errors=errors
        )
