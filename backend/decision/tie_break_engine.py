from typing import List, Dict, Any
from review.review_context import ReviewContext

class TieBreakEngine:
    def __init__(self, rules: List[str]):
        self.rules = rules

    def resolve(self, candidates: List[ReviewContext], scores: Dict[str, float], runtimes: Dict[str, int]) -> ReviewContext:
        """
        Deterministically resolves tie breaks between candidates.
        """
        # Sort candidates by iterating through the rules in order of priority.
        # Higher is better for most metrics, except runtime and index.
        def tie_break_key(candidate: ReviewContext):
            keys = []
            for rule in self.rules:
                if rule == "confidence":
                    keys.append(candidate.confidence)
                elif rule == "policy":
                    keys.append(candidate.scores.get("policy", 0))
                elif rule == "grammar":
                    keys.append(candidate.scores.get("grammar", 0))
                elif rule == "runtime":
                    # Lower runtime is better, so negate it
                    keys.append(-runtimes.get(candidate.candidate_id, 999999))
                elif rule == "candidate_index":
                    # Lower index is better, negate it
                    # We will extract index from ID "session-0" -> 0
                    idx = int(candidate.candidate_id.split("-")[-1]) if "-" in candidate.candidate_id else 999
                    keys.append(-idx)
                else:
                    keys.append(0)
            return tuple(keys)

        sorted_candidates = sorted(candidates, key=tie_break_key, reverse=True)
        return sorted_candidates[0]
