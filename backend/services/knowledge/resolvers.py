import json
import os

class KnowledgeResolver:
    def resolve(self, analyzed_tokens: dict, context_obj) -> None:
        pass

class DictionaryResolver(KnowledgeResolver):
    def __init__(self, pack_dir: str):
        self.pack_dir = pack_dir
        self.pack_data = {}
        pack_path = os.path.join(self.pack_dir, "pack.json")
        if os.path.exists(pack_path):
            with open(pack_path, 'r', encoding='utf-8') as f:
                self.pack_data = json.load(f)

    def resolve(self, analyzed_tokens: dict, context) -> None:
        tokens = [t["token"] for t in analyzed_tokens["tokens"]]
        
        # Resolve Genre
        genres = self.pack_data.get("genres", {})
        for genre_key, genre_data in genres.items():
            if genre_key in tokens:
                context.genre = genre_data["value"]
                context.confidence["genre"] = 0.95
                
                # Check subgenre
                for sub in genre_data.get("subgenres", []):
                    if sub in tokens:
                        context.subgenre = sub
                        context.confidence["subgenre"] = 0.90
                        break
                break

        # Resolve Intent
        intents = self.pack_data.get("intents", {})
        for intent_key, intent_data in intents.items():
            if any(k in tokens for k in intent_data.get("keywords", [])):
                context.intent = intent_key
                context.confidence["intent"] = 0.85
                
                # Resolve CTA tied to intent
                ctas = self.pack_data.get("ctas", {})
                if intent_key in ctas:
                    context.cta = ctas[intent_key]
                    context.confidence["cta"] = 0.90
                break

        # Resolve Audience
        audiences = self.pack_data.get("audiences", {})
        for aud_key, aud_data in audiences.items():
            if any(k in tokens for k in aud_data.get("keywords", [])):
                context.audience = aud_key
                context.confidence["audience"] = 0.80
                break

        # Resolve Vocabulary
        vocab = self.pack_data.get("vocabulary", {})
        context.vocabulary["preferred"] = vocab.get("high_ctr", [])
        context.vocabulary["forbidden"] = vocab.get("forbidden", [])
        context.confidence["vocabulary"] = 1.0
