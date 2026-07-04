import os
from services.knowledge.context_builder import ContextBuilder
from services.strategy.strategy_builder import StrategyBuilder
from services.prompt_compiler import PromptCompiler

class RuntimeContractValidator:
    def __init__(self, backend_dir: str):
        self.backend_dir = backend_dir

    def validate(self):
        failures = []
        try:
            # 1. Knowledge
            pack_dir = os.path.join(self.backend_dir, "knowledge", "registry", "youtube", "music", "v1")
            k_builder = ContextBuilder(pack_dir)
            k_context = k_builder.build_context("rock")
            
            if not k_context.genre:
                failures.append("Runtime Contract Failure: KnowledgeContext missing genre")
                
            # 2. Strategy
            s_builder = StrategyBuilder(pack_dir)
            s_context = s_builder.build_context(k_context)
            
            if not s_context.goal:
                failures.append("Runtime Contract Failure: StrategyContext missing goal")
                
            # 3. Prompt Compiler
            prompt_text = "Keyword: {keyword}\nStrategy Rules:\n{strategy_rules}"
            manifest = {"variables": ["keyword", "strategy_rules"]}
            
            compiler = PromptCompiler(
                prompt_text=prompt_text,
                manifest=manifest,
                knowledge_context=k_context,
                strategy_context=s_context,
                provider_profile={"keyword": "rock"}
            )
            final_prompt = compiler.compile()
            
            if "maximize" not in final_prompt:
                failures.append("Runtime Contract Failure: Prompt Compiler did not inject Strategy rules properly")
                
        except Exception as e:
            failures.append(f"Runtime Contract Failure Exception: {e}")
            
        return len(failures) == 0, failures
