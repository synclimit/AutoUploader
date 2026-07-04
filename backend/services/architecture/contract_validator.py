from services.knowledge.knowledge_context import KnowledgeContext
from services.strategy.strategy_context import StrategyContext

class ContractValidator:
    @staticmethod
    def validate():
        failures = []
        
        # Check KnowledgeContext fields
        k_fields = {"genre", "subgenre", "intent", "audience", "tone", "language", "cta", "vocabulary", "seo_rules", "warnings", "fallbacks_used", "confidence"}
        k_obj = KnowledgeContext()
        actual_k_fields = set(k_obj.__dict__.keys())
        
        if not k_fields.issubset(actual_k_fields):
            failures.append(f"KnowledgeContext missing fields: {k_fields - actual_k_fields}")
            
        # Check StrategyContext fields (via dataclass fields since it's frozen)
        from dataclasses import fields
        s_fields = {"goal", "title_strategy", "description_strategy", "tags_strategy", "thumbnail_strategy", "language_strategy", "warnings", "fallbacks", "confidence", "reasons"}
        actual_s_fields = {f.name for f in fields(StrategyContext)}
        
        if not s_fields.issubset(actual_s_fields):
            failures.append(f"StrategyContext missing fields: {s_fields - actual_s_fields}")
            
        return len(failures) == 0, failures
