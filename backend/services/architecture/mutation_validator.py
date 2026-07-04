from services.knowledge.knowledge_context import KnowledgeContext
from services.strategy.strategy_context import StrategyContext
from dataclasses import FrozenInstanceError

class MutationValidator:
    @staticmethod
    def validate():
        failures = []
        
        # Test StrategyContext Immutability (Dataclass frozen)
        s_context = StrategyContext()
        try:
            s_context.goal = "new_goal"
            failures.append("StrategyContext is mutable!")
        except FrozenInstanceError:
            pass # Expected
            
        # Test KnowledgeContext Immutability
        k_context = KnowledgeContext()
        k_context.freeze()
        try:
            k_context.genre = "pop"
            failures.append("KnowledgeContext is mutable!")
        except FrozenInstanceError:
            pass # Expected
        
        return len(failures) == 0, failures
