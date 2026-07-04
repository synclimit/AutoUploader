from dataclasses import dataclass, field
from typing import Dict, Any, List

@dataclass(frozen=True)
class StrategyContext:
    goal: str = None
    title_strategy: Dict[str, Any] = field(default_factory=dict)
    description_strategy: Dict[str, Any] = field(default_factory=dict)
    tags_strategy: Dict[str, Any] = field(default_factory=dict)
    thumbnail_strategy: Dict[str, Any] = field(default_factory=dict)
    language_strategy: Dict[str, Any] = field(default_factory=dict)
    
    warnings: List[str] = field(default_factory=list)
    fallbacks: List[str] = field(default_factory=list)
    
    confidence: Dict[str, float] = field(default_factory=dict)
    reasons: Dict[str, str] = field(default_factory=dict)

    def to_dict(self):
        return {
            "goal": self.goal,
            "title_strategy": self.title_strategy,
            "description_strategy": self.description_strategy,
            "tags_strategy": self.tags_strategy,
            "thumbnail_strategy": self.thumbnail_strategy,
            "language_strategy": self.language_strategy,
            "warnings": self.warnings,
            "fallbacks": self.fallbacks,
            "confidence": self.confidence,
            "reasons": self.reasons
        }
