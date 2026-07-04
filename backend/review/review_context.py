from dataclasses import dataclass, field
from typing import Dict, List, Any

@dataclass(frozen=True)
class ReviewContext:
    candidate_id: str
    scores: Dict[str, int]
    warnings: List[str]
    recommendations: List[str]
    overall_score: float = 0.0
    winner: bool = False
    confidence: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "candidate_id": self.candidate_id,
            "overall_score": self.overall_score,
            "winner": self.winner,
            "scores": self.scores,
            "warnings": self.warnings,
            "recommendations": self.recommendations,
            "confidence": self.confidence
        }
