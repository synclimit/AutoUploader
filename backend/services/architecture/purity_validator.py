import os
import json
import re

class PurityValidator:
    def __init__(self, backend_dir: str):
        self.backend_dir = backend_dir
        
    def validate(self):
        failures = []
        
        # 1. Prompt Purity
        # Prompts shouldn't contain strategy or formatting business rules.
        forbidden_prompt = ["seo", "emoji", "style", "hook", "limit", "emotional", "title style"]
        prompt_dirs = [
            os.path.join(self.backend_dir, "prompts", "registry")
        ]
        
        for pdir in prompt_dirs:
            if not os.path.exists(pdir): continue
            for root, _, files in os.walk(pdir):
                if "prompt.txt" in files:
                    filepath = os.path.join(root, "prompt.txt")
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read().lower()
                        for word in forbidden_prompt:
                            if word in content:
                                failures.append(f"Prompt Purity Failure: '{word}' found in {filepath}")
                                
        # 2. Knowledge Purity
        # Knowledge shouldn't contain generation instructions.
        forbidden_knowledge = ["generate", "write", "rules", "limit"]
        knowledge_dir = os.path.join(self.backend_dir, "knowledge", "registry")
        
        if os.path.exists(knowledge_dir):
            for root, _, files in os.walk(knowledge_dir):
                if "pack.json" in files:
                    filepath = os.path.join(root, "pack.json")
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read().lower()
                        for word in forbidden_knowledge:
                            if f'"{word}' in content or f' {word} ' in content:
                                failures.append(f"Knowledge Purity Failure: '{word}' found in {filepath}")
                                
        # 3. Strategy Purity
        # Strategy shouldn't contain domain knowledge terms
        forbidden_strategy = ["rock", "pop", "indonesia", "teen", "adult", "playlist"]
        strategy_dir = os.path.join(self.backend_dir, "strategy", "registry")
        
        if os.path.exists(strategy_dir):
            for root, _, files in os.walk(strategy_dir):
                if "strategy.json" in files:
                    filepath = os.path.join(root, "strategy.json")
                    with open(filepath, 'r', encoding='utf-8') as f:
                        # Parse to only look at keys/values roughly, but simpler:
                        # just string match
                        content = f.read().lower()
                        for word in forbidden_strategy:
                            # Use regex to find whole words
                            if re.search(r'\b' + re.escape(word) + r'\b', content):
                                failures.append(f"Strategy Purity Failure: Domain knowledge '{word}' found in {filepath}")
                                
        return len(failures) == 0, failures
