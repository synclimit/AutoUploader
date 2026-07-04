from typing import List
from change_planner.models import ChangeDependency

class DependencyAnalyzer:
    def __init__(self, rules: dict):
        self.rules = rules

    def analyze(self, target_layer: str, proposed_change: str) -> List[ChangeDependency]:
        deps = []
        # Mocking dependency graph extraction based on target
        if target_layer == "Prompt":
            deps.append(ChangeDependency(registry="Strategy", required_version="v2"))
            deps.append(ChangeDependency(registry="Knowledge", required_version="v1"))
        elif target_layer == "Strategy":
            deps.append(ChangeDependency(registry="Knowledge", required_version="latest"))
            
        return deps
