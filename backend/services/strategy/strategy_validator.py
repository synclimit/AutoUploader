class StrategyValidator:
    @staticmethod
    def validate(temp_context: dict) -> None:
        if "warnings" not in temp_context:
            temp_context["warnings"] = []
        if "fallbacks" not in temp_context:
            temp_context["fallbacks"] = []
            
        if not temp_context.get("goal"):
            temp_context["warnings"].append("Unknown optimization goal")
            temp_context["goal"] = "maximize_seo"
            temp_context["fallbacks"].append("goal: maximize_seo (Balanced Default)")
            
        # Ensure rules dictionaries exist
        for key in ["title_strategy", "description_strategy", "tags_strategy", "thumbnail_strategy", "language_strategy"]:
            if not temp_context.get(key):
                temp_context["warnings"].append(f"Missing {key}")
                temp_context[key] = {}
                temp_context["fallbacks"].append(f"{key}: Empty Ruleset")
