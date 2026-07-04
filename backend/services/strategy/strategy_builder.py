import json
import os
import time
from services.strategy.strategy_context import StrategyContext
from services.strategy.engines.goal_engine import GoalEngine
from services.strategy.engines.rule_engine import RuleEngine
from services.strategy.strategy_validator import StrategyValidator
from telemetry.event_bus import EventBus
from telemetry.events import StrategyStarted, StrategyResolved, StrategyFailed
from telemetry.session_manager import SessionManager

class StrategyBuilder:
    def __init__(self, pack_dir: str):
        self.pack_dir = pack_dir
        self.strategy_data = {}
        self.trace = []
        
        # Load registry data
        # Mapping knowledge pack dir to strategy pack dir assuming parallel structures
        strategy_file = os.path.join(self.pack_dir.replace("knowledge", "strategy"), "strategy.json")
        if os.path.exists(strategy_file):
            with open(strategy_file, 'r', encoding='utf-8') as f:
                self.strategy_data = json.load(f)
                
        self.engines = {
            "title": RuleEngine("title_rules", "Title"),
            "description": RuleEngine("description_rules", "Description"),
            "tags": RuleEngine("tag_rules", "Tags"),
            "thumbnail": RuleEngine("thumbnail_rules", "Thumbnail"),
            "language": RuleEngine("language_rules", "Language"),
        }

    def build_context(self, knowledge_context) -> StrategyContext:
        start_time = time.time()
        session_id, corr_id = SessionManager.get_session()
        EventBus.publish(StrategyStarted(session_id, corr_id, metadata={"knowledge_genre": getattr(knowledge_context, 'genre', 'unknown')}))

        self.trace = []
        temp_context = {
            "confidence": {},
            "reasons": {},
            "warnings": [],
            "fallbacks": []
        }
        
        # 1. Goal Engine
        goal_engine = GoalEngine()
        goal_result = goal_engine.execute(knowledge_context, self.strategy_data)
        goal = goal_result["goal"]
        temp_context["goal"] = goal
        temp_context["confidence"]["goal"] = goal_result["confidence"]
        temp_context["reasons"]["goal"] = goal_result["reason"]
        self.trace.append({"stage": "Goal Engine", "output": goal_result})
        
        # 2-6. Rule Engines
        for engine_key, engine in self.engines.items():
            result = engine.execute(goal, self.strategy_data)
            temp_context[f"{engine_key}_strategy"] = result["rules"]
            temp_context["confidence"][engine_key] = result["confidence"]
            temp_context["reasons"][engine_key] = result["reason"]
            self.trace.append({"stage": f"{engine.name} Engine", "output": result})
            
        # 7. Validator
        StrategyValidator.validate(temp_context)
        self.trace.append({"stage": "Validator", "output": temp_context["fallbacks"]})
        
        # 8. Instantiate Immutable Context
        strategy_context = StrategyContext(**temp_context)

        runtime_ms = int((time.time() - start_time) * 1000)
        EventBus.publish(StrategyResolved(session_id, corr_id, runtime_ms=runtime_ms, metadata={
            "goal": strategy_context.goal,
            "warnings": strategy_context.warnings
        }))

        return strategy_context
        
    def get_trace(self):
        return self.trace
