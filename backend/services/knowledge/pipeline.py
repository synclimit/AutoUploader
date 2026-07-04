import re

class Normalizer:
    @staticmethod
    def normalize(keyword: str) -> str:
        text = keyword.lower()
        # Remove punctuation
        text = re.sub(r'[^\w\s]', '', text)
        # Remove duplicate whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        return text

class Tokenizer:
    @staticmethod
    def tokenize(normalized_keyword: str) -> list:
        return normalized_keyword.split()

class KeywordAnalyzer:
    @staticmethod
    def analyze(tokens: list) -> dict:
        # A simple classifier. In a real system, this might use a small ML model or dictionary.
        # Here we just label tokens based on position/heuristics for simulation.
        labeled = []
        for token in tokens:
            if token in ["lagu", "musik", "music", "song"]:
                labeled.append({"token": token, "label": "music_term"})
            elif token in ["rock", "pop", "jazz", "metal"]:
                labeled.append({"token": token, "label": "genre"})
            elif token in ["indonesia", "barat", "korea"]:
                labeled.append({"token": token, "label": "region"})
            elif token in ["playlist", "full", "album", "cover"]:
                labeled.append({"token": token, "label": "intent"})
            else:
                labeled.append({"token": token, "label": "unknown"})
        return {"tokens": labeled}
