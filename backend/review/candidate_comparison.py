from typing import List, Tuple
from review.candidate_collection import CandidateCollection
from review.review_context import ReviewContext
from review.review_builder import ReviewBuilder
from review.validators.review_validator import ReviewValidator
from telemetry.event_bus import EventBus
from telemetry.events import ReviewStarted, CandidateScored, CandidateRejected, CandidateWinner, ReviewCompleted
from telemetry.session_manager import SessionManager
import time

class CandidateComparison:
    def __init__(self):
        self.builder = ReviewBuilder()

    def evaluate_candidates(self, collection: CandidateCollection, knowledge_context=None, strategy_context=None) -> Tuple[ReviewContext, List[ReviewContext]]:
        start_time = time.time()
        session_id, corr_id = SessionManager.get_session()
        
        EventBus.publish(ReviewStarted(session_id, corr_id, metadata={"candidate_count": len(collection)}))
        
        contexts = []
        for cand in collection:
            ctx = self.builder.build_review(cand, knowledge_context, strategy_context)
            ReviewValidator.validate(ctx)
            contexts.append(ctx)
            EventBus.publish(CandidateScored(session_id, corr_id, metadata={
                "candidate_id": ctx.candidate_id,
                "overall_score": ctx.overall_score
            }))
            
        # Sort contexts by highest overall score
        contexts.sort(key=lambda c: c.overall_score, reverse=True)
        
        winner_ctx = None
        if contexts:
            # Rebuild winner to set winner=True (dataclass is frozen, so we use replace)
            from dataclasses import replace
            winner_ctx = replace(contexts[0], winner=True)
            contexts[0] = winner_ctx
            EventBus.publish(CandidateWinner(session_id, corr_id, metadata={"candidate_id": winner_ctx.candidate_id}))
            
            for loser in contexts[1:]:
                EventBus.publish(CandidateRejected(session_id, corr_id, metadata={"candidate_id": loser.candidate_id}))
                
        runtime_ms = int((time.time() - start_time) * 1000)
        EventBus.publish(ReviewCompleted(session_id, corr_id, runtime_ms=runtime_ms, metadata={
            "winner": winner_ctx.candidate_id if winner_ctx else None
        }))
        
        return winner_ctx, contexts

    def generate_report(self, winner: ReviewContext, all_contexts: List[ReviewContext]) -> str:
        output = ["--- Review Report ---"]
        
        for ctx in all_contexts:
            status = "WINNER" if ctx.winner else "LOSER"
            output.append(f"\nCandidate {ctx.candidate_id} [{status}]")
            for engine, score in ctx.scores.items():
                output.append(f"  {engine.capitalize()}: {score}")
            output.append(f"  Overall: {ctx.overall_score:.1f}")
            if ctx.recommendations:
                output.append(f"  Recommendations: {', '.join(ctx.recommendations)}")
            if ctx.warnings:
                output.append(f"  Warnings: {', '.join(ctx.warnings)}")
                
        output.append("\n---------------------")
        if winner:
            output.append(f"Final Selection: Candidate {winner.candidate_id}")
        return "\n".join(output)
