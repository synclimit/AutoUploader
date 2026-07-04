import json
import os
from services.prompt_manager import PromptManager
from services.prompt_compiler import PromptCompiler

class PromptTester:
    def __init__(self, tests_dir: str, manager: PromptManager):
        self.tests_dir = tests_dir
        self.manager = manager
        
    def run_all(self):
        results = []
        if not os.path.exists(self.tests_dir):
            return results
            
        for file in os.listdir(self.tests_dir):
            if file.endswith(".json"):
                prompt_name = file.replace(".json", "")
                result = self.run_test(prompt_name)
                results.append(result)
                
        return results

    def run_test(self, prompt_name: str) -> dict:
        test_file = os.path.join(self.tests_dir, f"{prompt_name}.json")
        if not os.path.exists(test_file):
            return {"prompt": prompt_name, "status": "SKIP", "reason": "No test file"}
            
        try:
            with open(test_file, 'r', encoding='utf-8') as f:
                test_spec = json.load(f)
        except Exception as e:
            return {"prompt": prompt_name, "status": "FAIL", "reason": f"Invalid test JSON: {e}"}
            
        try:
            # We load the latest version by default for tests
            data = self.manager.load(prompt_name, "latest")
            compiler = PromptCompiler(data["prompt_text"], data["manifest"], test_spec.get("variables", {}))
            final_prompt = compiler.compile()
            
            # Now assert expectations
            expected = test_spec.get("expected", {})
            contains = expected.get("contains", [])
            not_contains = expected.get("not_contains", [])
            
            for word in contains:
                if word not in final_prompt:
                    return {"prompt": prompt_name, "status": "FAIL", "reason": f"Missing expected word: {word}"}
                    
            for word in not_contains:
                if word in final_prompt:
                    return {"prompt": prompt_name, "status": "FAIL", "reason": f"Contains forbidden word: {word}"}
                    
            return {"prompt": prompt_name, "status": "PASS", "reason": ""}
            
        except Exception as e:
            return {"prompt": prompt_name, "status": "FAIL", "reason": f"Compilation error: {e}"}
