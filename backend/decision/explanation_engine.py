from review.review_context import ReviewContext

class ExplanationEngine:
    @staticmethod
    def explain(winner: ReviewContext, is_fallback: bool, profile: dict) -> str:
        lines = []
        if is_fallback:
            lines.append(f"Selected Candidate {winner.candidate_id} via Fallback Strategy ({profile.get('fallback', {}).get('strategy', 'highest_overall_unweighted')}).")
            lines.append("All candidates failed minimum threshold rules.")
        else:
            lines.append(f"Selected Candidate {winner.candidate_id} as the Winner.")
            lines.append(f"Highest weighted {profile.get('optimization_goal', 'unknown')} score.")
            if winner.scores.get("policy", 0) >= profile.get("rules", {}).get("required_policy_score", 100):
                lines.append("Passed all policy rules.")
            lines.append(f"Confidence score of {winner.confidence}.")
            if winner.scores.get("grammar", 0) >= profile.get("rules", {}).get("minimum_grammar", 60):
                lines.append("Grammar above threshold.")
            if winner.scores.get("clickbait", 0) <= profile.get("rules", {}).get("maximum_clickbait", 100):
                lines.append("No clickbait violations.")
                
        return "\n".join(lines)
