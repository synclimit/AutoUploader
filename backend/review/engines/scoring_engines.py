from typing import Dict, List, Tuple
import re

from typing import Dict, List, Tuple
from review.candidate_metadata import CandidateMetadata

class EngineBase:
    def evaluate(self, candidate: CandidateMetadata, knowledge_context=None, strategy_context=None) -> Tuple[int, List[str], List[str]]:
        """
        Returns (score: int, warnings: List[str], recommendations: List[str])
        """
        raise NotImplementedError

class IntentEngine(EngineBase):
    def evaluate(self, candidate, knowledge, strategy):
        # Mock logic
        return 95, [], []

class KeywordEngine(EngineBase):
    def evaluate(self, candidate: CandidateMetadata, knowledge, strategy):
        title = candidate.title.lower()
        if knowledge and getattr(knowledge, "genre", None):
            if knowledge.genre.lower() not in title:
                return 70, ["Genre not in title"], ["Include genre in title"]
        return 94, [], []

class SEOEngine(EngineBase):
    def evaluate(self, candidate: CandidateMetadata, knowledge, strategy):
        title = candidate.title
        if len(title) > 60:
            return 80, ["Title exceeds 60 chars"], ["Shorten title"]
        return 95, [], []

class ReadabilityEngine(EngineBase):
    def evaluate(self, candidate, knowledge, strategy):
        return 90, [], []

class GrammarEngine(EngineBase):
    def evaluate(self, candidate: CandidateMetadata, knowledge, strategy):
        # Basic check for multiple exclamation marks
        title = candidate.title
        if "!!" in title:
            return 85, ["Double exclamation mark found"], ["Remove excessive punctuation"]
        return 100, [], []

class NaturalnessEngine(EngineBase):
    def evaluate(self, candidate, knowledge, strategy):
        return 96, [], []

class CTAEngine(EngineBase):
    def evaluate(self, candidate: CandidateMetadata, knowledge, strategy):
        desc = candidate.description.lower()
        if "subscribe" not in desc and "like" not in desc:
            return 75, ["No clear CTA found in description"], ["Add a subscribe or like CTA"]
        return 90, [], []

class AudienceEngine(EngineBase):
    def evaluate(self, candidate, knowledge, strategy):
        return 92, [], []

class ClickbaitEngine(EngineBase):
    def evaluate(self, candidate: CandidateMetadata, knowledge, strategy):
        title = candidate.title.lower()
        if "you won't believe" in title or "shocking" in title:
            return 50, ["High clickbait risk detected"], ["Remove clickbait phrases"]
        return 95, [], []

class PolicyEngine(EngineBase):
    def evaluate(self, candidate: CandidateMetadata, knowledge, strategy):
        # Mock check for restricted words
        desc = candidate.description.lower()
        restricted = ["hack", "crack", "free money"]
        for r in restricted:
            if r in desc:
                return 0, [f"Restricted policy word '{r}' found"], ["Remove policy violations immediately"]
        return 100, [], []
