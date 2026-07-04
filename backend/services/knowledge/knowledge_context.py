from dataclasses import FrozenInstanceError

class KnowledgeContext:
    def __init__(self):
        self._frozen = False
        self.genre = None
        self.subgenre = None
        self.intent = None
        self.audience = None
        self.tone = None
        self.language = None
        self.cta = None
        self.vocabulary = {"preferred": [], "forbidden": []}
        self.seo_rules = []
        self.warnings = []
        self.fallbacks_used = []
        self.confidence = {} # stores confidence for each resolved field

    def add_warning(self, message: str):
        self.warnings.append(message)
        
    def add_fallback(self, field: str, value: str):
        self.fallbacks_used.append(f"{field}: {value}")
        
    def freeze(self):
        self._frozen = True
        
    def __setattr__(self, key, value):
        if getattr(self, "_frozen", False) and key != "_frozen":
            raise FrozenInstanceError(f"Cannot mutate KnowledgeContext field {key} because it is frozen")
        super().__setattr__(key, value)
        
    def to_dict(self):
        return {
            "genre": self.genre,
            "subgenre": self.subgenre,
            "intent": self.intent,
            "audience": self.audience,
            "tone": self.tone,
            "language": self.language,
            "cta": self.cta,
            "vocabulary": self.vocabulary,
            "seo_rules": self.seo_rules,
            "warnings": self.warnings,
            "fallbacks_used": self.fallbacks_used,
            "confidence": self.confidence
        }
