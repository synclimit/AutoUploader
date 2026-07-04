import os
import json
import time
import uuid
import datetime
from feedback.feedback_context import FeedbackContext
from feedback.feedback_package import FeedbackPackage
from feedback.engines.user_feedback_engine import SelectionEngine, OverrideEngine, EditEngine, SaveEngine
from feedback.engines.performance_engine import PerformanceEngine
from feedback.engines.feedback_score_engine import FeedbackScoreEngine
from telemetry.event_bus import EventBus
from telemetry.events import FeedbackStarted, FeedbackCollected, ManualEditDetected, UserOverrideDetected, FeedbackNormalized, FeedbackCompleted
from telemetry.session_manager import SessionManager

class FeedbackBuilder:
    def __init__(self, registry_dir: str):
        self.registry_dir = registry_dir

    def load_profile(self, category: str, topic: str, version: str) -> dict:
        profile_path = os.path.join(self.registry_dir, category, topic, version, "feedback.json")
        with open(profile_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def build_feedback(self, session_id: str, decision_context, original_text: str, edited_text: str, user_action: str, upload_status: str, metrics: dict, category: str, topic: str, version: str) -> FeedbackPackage:
        start_time = time.time()
        _, corr_id = SessionManager.get_session()
        
        EventBus.publish(FeedbackStarted(session_id, corr_id))
        
        rules = self.load_profile(category, topic, version)
        
        is_saved = SaveEngine.detect(user_action)
        is_discarded = user_action == "discarded"
        
        edit_distance_pct = EditEngine.calculate(original_text, edited_text)
        if edit_distance_pct > 0:
            EventBus.publish(ManualEditDetected(session_id, corr_id, metadata={"edit_distance": edit_distance_pct}))
            
        # Hardcoding no override for simplicity in trace proof unless specified
        is_override = False
        if is_override:
            EventBus.publish(UserOverrideDetected(session_id, corr_id))
            
        perf_score = PerformanceEngine.collect(upload_status, metrics)
        feedback_score = FeedbackScoreEngine.compute(edit_distance_pct, is_discarded, is_override, rules)
        
        norm_rules = rules.get("normalization", {})
        overall_score = (feedback_score * norm_rules.get("feedback_weight", 0.5)) + (perf_score * norm_rules.get("performance_weight", 0.5))
        
        context = FeedbackContext(
            session_id=session_id,
            feedback_id=str(uuid.uuid4()),
            candidate_id=decision_context.selected_candidate,
            decision_profile=decision_context.profile_version,
            winner=decision_context.selected_candidate,
            user_selection=decision_context.selected_candidate,
            user_override=is_override,
            manual_edits={"text": edited_text},
            edit_distance=edit_distance_pct,
            upload_status=upload_status,
            performance_status=metrics,
            feedback_score=feedback_score,
            confidence=1.0,
            fallback_used=decision_context.fallback_used,
            runtime_ms=int((time.time() - start_time) * 1000),
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
        EventBus.publish(FeedbackCollected(session_id, corr_id, metadata={"feedback_id": context.feedback_id}))
        
        package = FeedbackPackage(
            prompt_version="v1",
            knowledge_version="v1",
            strategy_version="v1",
            review_version="v1",
            decision_version=decision_context.profile_version,
            candidate_id=context.candidate_id,
            winner=context.winner,
            user_choice=context.user_selection,
            feedback_score=context.feedback_score,
            edit_score=100.0 - context.edit_distance,
            performance_score=perf_score,
            overall_score=overall_score,
            provider="openai_compatible",
            runtime=context.runtime_ms,
            timestamp=context.timestamp
        )
        
        EventBus.publish(FeedbackNormalized(session_id, corr_id, metadata={"overall_score": overall_score}))
        EventBus.publish(FeedbackCompleted(session_id, corr_id, runtime_ms=context.runtime_ms))
        
        return package
