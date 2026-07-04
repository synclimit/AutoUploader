import json
import re
import hashlib
import time
from typing import Dict, Any
from telemetry.event_bus import EventBus
from telemetry.events import PromptCompilationStarted, PromptCompiled, PromptCompilationFailed
from telemetry.session_manager import SessionManager

class PromptCompiler:
    def __init__(self, prompt_text: str, manifest: dict, knowledge_context=None, strategy_context=None, provider_profile=None):
        self.prompt_text = prompt_text
        self.manifest = manifest
        
        # Flatten contexts into variables_input for injection
        self.variables_input = {}
        if knowledge_context:
            self.variables_input.update(knowledge_context.to_dict())
            
        if strategy_context:
            # We inject the full structured strategy as a JSON string for the LLM
            # But we exclude the noisy meta-fields like warnings and confidence
            strategy_dict = strategy_context.to_dict()
            safe_strategy = {
                "goal": strategy_dict.get("goal"),
                "title_strategy": strategy_dict.get("title_strategy"),
                "description_strategy": strategy_dict.get("description_strategy"),
                "tags_strategy": strategy_dict.get("tags_strategy"),
                "thumbnail_strategy": strategy_dict.get("thumbnail_strategy"),
                "language_strategy": strategy_dict.get("language_strategy")
            }
            self.variables_input["strategy_rules"] = json.dumps(safe_strategy, indent=2)
            
        if provider_profile:
            self.variables_input.update(provider_profile)
            
        self.final_prompt = prompt_text
        self.fingerprint = None

    def generate_fingerprint(self):
        # Hash(prompt.txt + manifest.json)
        # Sort manifest keys for deterministic hashing
        manifest_str = json.dumps(self.manifest, sort_keys=True)
        content = self.prompt_text + manifest_str
        self.fingerprint = hashlib.sha256(content.encode('utf-8')).hexdigest()
        return self.fingerprint

    def validate_manifest(self):
        required_vars = self.manifest.get("variables", [])
        missing = [v for v in required_vars if v not in self.variables_input]
        if missing:
            session_id, corr_id = SessionManager.get_session()
            EventBus.publish(PromptCompilationFailed(session_id, corr_id, metadata={"missing_vars": list(missing)}))
            raise ValueError(f"Missing required variables: {missing}")
        return self

    def resolve_variables(self):
        # Flatten vocabulary lists for basic replacement
        vocab = self.variables_input.get("vocabulary", {})
        preferred = ", ".join(vocab.get("preferred", []))
        forbidden = ", ".join(vocab.get("forbidden", []))
        
        replacements = {
            "keyword": self.variables_input.get("keyword", ""),
            "genre": self.variables_input.get("genre", ""),
            "intent": self.variables_input.get("intent", ""),
            "audience": self.variables_input.get("audience", ""),
            "cta": self.variables_input.get("cta", ""),
            "preferred_vocab": preferred,
            "forbidden_vocab": forbidden,
            "language": self.variables_input.get("language", ""),
            "provider": self.variables_input.get("provider", "generic"),
            "content_type": self.variables_input.get("content_type", ""),
            "tone": self.variables_input.get("tone", "")
        }
        
        # Also include any direct variables_input keys
        for k, v in self.variables_input.items():
            if k not in replacements and isinstance(v, (str, int, float)):
                replacements[k] = v
                
        for key, value in replacements.items():
            placeholder = f"{{{key}}}"
            self.final_prompt = self.final_prompt.replace(placeholder, str(value))
        return self

    def cleanup_sections(self):
        # Remove lines that contain empty placeholders that were not provided
        lines = self.final_prompt.split("\n")
        cleaned_lines = [line for line in lines if not re.search(r'\{[a-zA-Z0-9_]+\}', line)]
        self.final_prompt = "\n".join(cleaned_lines)
        return self

    def inject_provider(self):
        provider = self.variables_input.get("provider", "generic").lower()
        if provider == "gemini":
            self.final_prompt += "\n\n[System: Optimize output for Gemini models]"
        elif provider == "openai":
            self.final_prompt += "\n\n[System: Optimize output for OpenAI models]"
        return self

    def inject_json_schema(self):
        # Dummy schema injection for example purposes
        schema = {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "description": {"type": "string"}
            },
            "required": ["title", "description"]
        }
        self.final_prompt += "\n\nOutput must follow this JSON schema:\n" + json.dumps(schema, indent=2)
        return self

    def inject_evaluation_profile(self):
        profile = self.variables_input.get("evaluation_profile")
        if profile:
            self.final_prompt += f"\n\n[Evaluation Profile: {profile}] Ensure compliance with this profile."
        return self
        
    def validate_output(self):
        if not self.final_prompt.strip():
            raise ValueError("Final prompt is empty after compilation.")
        return self

    def compile(self) -> str:
        start_time = time.time()
        session_id, corr_id = SessionManager.get_session()
        EventBus.publish(PromptCompilationStarted(session_id, corr_id, metadata={"prompt_vars": self.manifest.get("variables", [])}))
        
        self.validate_manifest() \
            .resolve_variables() \
            .cleanup_sections() \
            .inject_provider() \
            .inject_json_schema() \
            .inject_evaluation_profile() \
            .validate_output()
            
        runtime_ms = int((time.time() - start_time) * 1000)
        EventBus.publish(PromptCompiled(session_id, corr_id, runtime_ms=runtime_ms, metadata={
            "prompt_length": len(self.final_prompt)
        }))
        
        return self.final_prompt
