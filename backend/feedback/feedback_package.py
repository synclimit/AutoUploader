from dataclasses import dataclass

@dataclass(frozen=True)
class FeedbackPackage:
    prompt_version: str
    knowledge_version: str
    strategy_version: str
    review_version: str
    decision_version: str
    candidate_id: str
    winner: str
    user_choice: str
    feedback_score: float
    edit_score: float
    performance_score: float
    overall_score: float
    provider: str
    runtime: int
    timestamp: str
