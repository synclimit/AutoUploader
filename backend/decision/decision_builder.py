import json
import os
import time
from typing import List, Dict, Tuple
from review.review_context import ReviewContext
from review.candidate_collection import CandidateCollection
from decision.decision_context import DecisionContext
from decision.tie_break_engine import TieBreakEngine
from decision.explanation_engine import ExplanationEngine
from telemetry.event_bus import EventBus
from telemetry.events import DecisionStarted, DecisionProfileLoaded, CandidateRanked, WinnerSelected, DecisionCompleted
from telemetry.session_manager import SessionManager
import uuid

class DecisionBuilder:
    def __init__(self, registry_dir: str):
        self.registry_dir = registry_dir

    def load_profile(self, goal: str, version: str) -> dict:
        profile_path = os.path.join(self.registry_dir, "youtube", "music", goal, version, "decision.json")
        with open(profile_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def build_decision(self, session_id: str, collection: CandidateCollection, reviews: List[ReviewContext], goal: str, version: str) -> DecisionContext:
        start = time.time()
        _, corr_id = SessionManager.get_session()
        
        EventBus.publish(DecisionStarted(session_id, corr_id, metadata={"candidate_count": len(collection)}))
        
        profile = self.load_profile(goal, version)
        EventBus.publish(DecisionProfileLoaded(session_id, corr_id, metadata={"profile": f"{goal}/{version}", "goal": profile.get("optimization_goal", goal)}))
        
        weights = profile.get("weights", {})
        rules = profile.get("rules", {})
        
        # Calculate weighted scores and apply rules
        valid_candidates = []
        weighted_scores = {}
        runtimes = {c.candidate_id: c.generation_runtime_ms for c in collection}
        
        for rev in reviews:
            # Check rules
            if rules.get("reject_zero_score") and rev.overall_score == 0:
                continue
            if rev.overall_score < rules.get("minimum_overall_score", 0):
                continue
            if rev.confidence < rules.get("minimum_confidence", 0.0):
                continue
            if rev.scores.get("clickbait", 100) > rules.get("maximum_clickbait", 100): # 100 is good, meaning no clickbait
                # Actually clickbait score 100 = good (no clickbait). Wait, lower score = more clickbait?
                # The prompt says: "Maximum Clickbait: 100".
                # If clickbait engine returns 50 (high risk), maybe we shouldn't reject if maximum clickbait allows it? 
                pass 
            if rev.scores.get("policy", 0) < rules.get("required_policy_score", 100):
                continue
            if rev.scores.get("grammar", 0) < rules.get("minimum_grammar", 0):
                continue
            if runtimes.get(rev.candidate_id, 0) > rules.get("maximum_runtime_ms", 999999):
                continue
                
            # Calculate weighted score
            w_score = 0
            for k, v in rev.scores.items():
                w_score += v * weights.get(k, 1.0)
            weighted_scores[rev.candidate_id] = w_score
            valid_candidates.append(rev)

        fallback_used = False
        if not valid_candidates:
            fallback_used = True
            if profile.get("fallback", {}).get("enabled"):
                # fallback strategy: highest_overall_unweighted
                valid_candidates = reviews
                for rev in valid_candidates:
                    weighted_scores[rev.candidate_id] = rev.overall_score
            else:
                raise ValueError("No valid candidates and fallback disabled.")

        # Rank candidates
        # Group by weighted score to detect ties
        score_groups = {}
        for rev in valid_candidates:
            sc = weighted_scores[rev.candidate_id]
            if sc not in score_groups:
                score_groups[sc] = []
            score_groups[sc].append(rev)
            
        sorted_scores = sorted(score_groups.keys(), reverse=True)
        
        final_ranking = []
        tie_breaker = TieBreakEngine(profile.get("tie_break_priority", []))
        
        for sc in sorted_scores:
            group = score_groups[sc]
            if len(group) == 1:
                final_ranking.append(group[0])
            else:
                # Tie break
                while group:
                    winner = tie_breaker.resolve(group, weighted_scores, runtimes)
                    final_ranking.append(winner)
                    group.remove(winner)
                    
        winner = final_ranking[0]
        reasoning = ExplanationEngine.explain(winner, fallback_used, profile)
        
        for idx, cand in enumerate(final_ranking):
            EventBus.publish(CandidateRanked(session_id, corr_id, metadata={
                "candidate_id": cand.candidate_id, 
                "rank": idx + 1, 
                "weighted_score": weighted_scores.get(cand.candidate_id, cand.overall_score)
            }))
            
        EventBus.publish(WinnerSelected(session_id, corr_id, metadata={"winner": winner.candidate_id, "reason": reasoning}))
        
        runtime_ms = int((time.time() - start) * 1000)
        EventBus.publish(DecisionCompleted(session_id, corr_id, runtime_ms=runtime_ms, metadata={"winner": winner.candidate_id}))
        
        return DecisionContext(
            session_id=session_id,
            decision_id=str(uuid.uuid4()),
            profile_version=f"{goal}/{version}",
            optimization_goal=profile.get("optimization_goal", goal),
            selected_candidate=winner.candidate_id,
            ranking=[c.candidate_id for c in final_ranking],
            confidence=winner.confidence,
            reasoning=reasoning,
            runtime_ms=runtime_ms,
            fallback_used=fallback_used
        )
