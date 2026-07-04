class RuleEngine:
    def __init__(self, key: str, name: str):
        self.key = key
        self.name = name

    def execute(self, goal: str, strategy_data: dict) -> dict:
        goals = strategy_data.get("goals", {})
        goal_data = goals.get(goal, {})
        rules = goal_data.get(self.key, {})
        
        if not rules:
            return {
                "rules": {},
                "confidence": 0.0,
                "reason": f"No {self.name} rules found for goal '{goal}'"
            }
            
        return {
            "rules": rules,
            "confidence": 0.95,
            "reason": f"Loaded {self.name} rules for goal '{goal}'"
        }
