import os
import ast

class DependencyValidator:
    def __init__(self, backend_dir: str):
        self.backend_dir = backend_dir

    def validate(self):
        # We will scan services/knowledge and services/strategy
        # knowledge must not import strategy
        # prompt_compiler must not import strategy or knowledge (only prompt_cli orchestrates)
        
        failures = []
        
        knowledge_dir = os.path.join(self.backend_dir, "services", "knowledge")
        strategy_dir = os.path.join(self.backend_dir, "services", "strategy")
        compiler_file = os.path.join(self.backend_dir, "services", "prompt_compiler.py")
        
        # Check Knowledge imports
        if os.path.exists(knowledge_dir):
            for root, _, files in os.walk(knowledge_dir):
                for file in files:
                    if file.endswith(".py"):
                        filepath = os.path.join(root, file)
                        imports = self._get_imports(filepath)
                        for imp in imports:
                            if "strategy" in imp or "prompt" in imp:
                                failures.append(f"Reverse Dependency: Knowledge layer file {file} imports {imp}")
                                
        # Check Strategy imports
        if os.path.exists(strategy_dir):
            for root, _, files in os.walk(strategy_dir):
                for file in files:
                    if file.endswith(".py"):
                        filepath = os.path.join(root, file)
                        imports = self._get_imports(filepath)
                        for imp in imports:
                            if "prompt" in imp:
                                failures.append(f"Reverse Dependency: Strategy layer file {file} imports {imp}")
                                
        # Check PromptCompiler imports
        if os.path.exists(compiler_file):
            imports = self._get_imports(compiler_file)
            for imp in imports:
                if "knowledge" in imp or "strategy" in imp:
                    failures.append(f"Hidden Dependency: PromptCompiler imports {imp}")
                    
        return len(failures) == 0, failures

    def _get_imports(self, filepath):
        imports = []
        with open(filepath, 'r', encoding='utf-8') as f:
            try:
                tree = ast.parse(f.read(), filename=filepath)
            except SyntaxError:
                return []
                
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.append(node.module)
        return imports
