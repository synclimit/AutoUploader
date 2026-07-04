class GoalEngine:
    def execute(self, knowledge_context, strategy_data) -> dict:
        # Priority 1: User Pref (mock missing for now)
        # Priority 2: Channel Profile (mock missing for now)
        # Priority 3: Knowledge Pack Recommendation
        intent = knowledge_context.intent
        
        # Simple deterministic map
        if intent == "playlist":
            return {
                "goal": "maximize_retention",
                "confidence": 0.95,
                "reason": "Intent=playlist maps to maximize_retention"
            }
            
        # Priority 4: Balanced Default
        return {
            "goal": "maximize_seo",
            "confidence": 0.80,
            "reason": "Fallback to Balanced Default"
        }
