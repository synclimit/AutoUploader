from typing import List
from feedback.feedback_package import FeedbackPackage

class BasePatternEngine:
    def analyze(self, packages: List[FeedbackPackage], rules: dict) -> dict:
        raise NotImplementedError

class UserBehaviorEngine(BasePatternEngine):
    def analyze(self, packages: List[FeedbackPackage], rules: dict) -> dict:
        if not packages:
            return {}
            
        thresholds = rules.get("thresholds", {})
        min_sample = thresholds.get("minimum_sample_size", 10)
        
        if len(packages) < min_sample:
            return {"status": "insufficient_data"}
            
        # Detect repeated manual edits
        edit_threshold = thresholds.get("user_edit_flag_percentage", 20.0)
        high_edit_count = sum(1 for p in packages if p.edit_score <= (100 - edit_threshold))
        
        edit_rate = high_edit_count / len(packages)
        confidence = min(edit_rate * 1.5, 0.98) # basic confidence heuristic
        
        if edit_rate > 0.5: # 50% of the time users heavily edit the prompt
            return {
                "status": "pattern_found",
                "observation": "Repeated user edits detected.",
                "frequency": edit_rate,
                "confidence": confidence,
                "evidence": len(packages),
                "target_layer": "Strategy",
                "target_component": "Content Rules"
            }
            
        return {"status": "no_pattern"}

class StrategyPatternEngine(BasePatternEngine):
    def analyze(self, packages: List[FeedbackPackage], rules: dict) -> dict:
        if not packages:
            return {}
            
        thresholds = rules.get("thresholds", {})
        min_sample = thresholds.get("minimum_sample_size", 10)
        
        if len(packages) < min_sample:
            return {"status": "insufficient_data"}
            
        # Detect performance regressions
        poor_performance_count = sum(1 for p in packages if p.performance_score < 50)
        poor_perf_rate = poor_performance_count / len(packages)
        
        confidence = min(poor_perf_rate * 1.2, 0.95)
        
        if poor_perf_rate > 0.4:
            return {
                "status": "pattern_found",
                "observation": "Repeated performance regressions detected.",
                "frequency": poor_perf_rate,
                "confidence": confidence,
                "evidence": len(packages),
                "target_layer": "Strategy",
                "target_component": "Optimization Goal"
            }
            
        return {"status": "no_pattern"}
