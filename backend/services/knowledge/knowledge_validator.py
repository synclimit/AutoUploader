class KnowledgeValidator:
    @staticmethod
    def validate(context) -> None:
        if not context.genre:
            context.add_warning("Genre unresolved")
            context.genre = "General"
            context.add_fallback("genre", "General")
            
        if not context.intent:
            context.add_warning("Intent unresolved")
            context.intent = "Generic Video"
            context.add_fallback("intent", "Generic Video")
            
        if not context.audience:
            context.add_warning("Audience unresolved")
            context.audience = "General Audience"
            context.add_fallback("audience", "General Audience")
            
        if not context.cta:
            context.add_warning("CTA unresolved")
            context.cta = "Like and Subscribe"
            context.add_fallback("cta", "Like and Subscribe")
