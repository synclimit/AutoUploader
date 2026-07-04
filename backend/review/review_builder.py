from typing import Dict, List
from review.review_context import ReviewContext
from review.engines.scoring_engines import (
    IntentEngine, KeywordEngine, SEOEngine, ReadabilityEngine, GrammarEngine,
    NaturalnessEngine, CTAEngine, AudienceEngine, ClickbaitEngine, PolicyEngine
)
from telemetry.event_bus import EventBus
from telemetry.events import CandidateScored

from review.candidate_metadata import CandidateMetadata

class ReviewBuilder:
    def __init__(self):
        self.engines = {
            "intent": IntentEngine(),
            "keyword": KeywordEngine(),
            "seo": SEOEngine(),
            "readability": ReadabilityEngine(),
            "grammar": GrammarEngine(),
            "naturalness": NaturalnessEngine(),
            "cta": CTAEngine(),
            "audience": AudienceEngine(),
            "clickbait": ClickbaitEngine(),
            "policy": PolicyEngine()
        }

    def build_review(self, candidate: CandidateMetadata, knowledge_context=None, strategy_context=None) -> ReviewContext:
        scores = {}
        all_warnings = []
        all_recs = []
        
        for name, engine in self.engines.items():
            score, warns, recs = engine.evaluate(candidate, knowledge_context, strategy_context)
            scores[name] = score
            all_warnings.extend(warns)
            all_recs.extend(recs)
            
        # Overall score is the average of all engine scores
        overall_score = sum(scores.values()) / len(scores) if scores else 0.0
        
        # Policy zeroes out everything if it fails
        if scores.get("policy", 100) == 0:
            overall_score = 0.0
            
        context = ReviewContext(
            candidate_id=candidate.candidate_id,
            scores=scores,
            warnings=all_warnings,
            recommendations=all_recs,
            overall_score=overall_score,
            confidence=0.95
        )
        
        # We don't have session_id available natively here unless passed. For CLI simulation, we'll assume it's injected.
        
        return context
