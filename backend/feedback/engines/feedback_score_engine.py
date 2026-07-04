class FeedbackScoreEngine:
    @staticmethod
    def compute(edit_percentage: float, is_discarded: bool, is_override: bool, rules: dict):
        scoring = rules.get("scoring", {})
        
        if is_discarded:
            base_score = scoring.get("discarded", 0)
        elif edit_percentage == 0:
            base_score = scoring.get("no_edits", 100)
        elif edit_percentage < 5:
            base_score = scoring.get("edit_below_5_percent", 95)
        elif edit_percentage < 20:
            base_score = scoring.get("edit_below_20_percent", 80)
        else:
            base_score = scoring.get("edit_above_50_percent", 40)
            
        if is_override:
            base_score -= rules.get("thresholds", {}).get("override_penalty", 20)
            
        return float(max(base_score, 0))
