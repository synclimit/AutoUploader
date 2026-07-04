import os
import json
from pathlib import Path

class RegistryGenerator:
    def __init__(self, registry_dir: str):
        self.registry_dir = registry_dir
        
    def generate(self, output_path: str):
        registry_data = {}
        base_path = Path(self.registry_dir)
        
        if not base_path.exists():
            with open(output_path, 'w') as f:
                json.dump(registry_data, f, indent=4)
            return registry_data

        # Traverse registry directory
        # e.g., youtube/metadata/music/v1
        for root, dirs, files in os.walk(base_path):
            if "manifest.json" in files:
                rel_path = Path(root).relative_to(base_path)
                parts = list(rel_path.parts)
                # Ensure it has a version folder, e.g., ["youtube", "metadata", "music", "v1"]
                if len(parts) >= 2:
                    version = parts[-1]
                    prompt_alias = "_".join(parts[:-1]) # e.g. youtube_metadata_music
                    
                    if prompt_alias not in registry_data:
                        registry_data[prompt_alias] = {}
                        
                    # read manifest to determine if production
                    manifest_path = os.path.join(root, "manifest.json")
                    try:
                        with open(manifest_path, 'r', encoding='utf-8') as f:
                            manifest = json.load(f)
                            status = manifest.get("status", "draft")
                            registry_data[prompt_alias][version] = version
                            
                            # Automatically set 'latest' to the highest version seen
                            # Naive sort by string, assuming v1, v2, v3
                            current_latest = registry_data[prompt_alias].get("latest", "")
                            if version > current_latest:
                                registry_data[prompt_alias]["latest"] = version
                                
                            if status == "production":
                                registry_data[prompt_alias]["production"] = version
                            elif status == "experiment":
                                registry_data[prompt_alias]["experiment"] = version
                    except Exception:
                        pass
                        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(registry_data, f, indent=4)
            
        return registry_data

class PromptManager:
    def __init__(self, registry_dir: str, registry_json_path: str):
        self.registry_dir = registry_dir
        self.registry_json_path = registry_json_path
        self._cache = {}
        
        # Ensure registry exists
        if not os.path.exists(self.registry_json_path):
            gen = RegistryGenerator(self.registry_dir)
            gen.generate(self.registry_json_path)
            
    def get_from_cache(self, cache_key: str, current_fingerprint: str):
        if cache_key in self._cache:
            entry = self._cache[cache_key]
            if entry["fingerprint"] == current_fingerprint:
                return entry["compiled"]
        return None
        
    def save_to_cache(self, cache_key: str, current_fingerprint: str, compiled: str):
        self._cache[cache_key] = {
            "fingerprint": current_fingerprint,
            "compiled": compiled
        }
            
    def load(self, prompt_name: str, version: str = "latest") -> dict:
        """
        Loads the prompt text and manifest for a given prompt name and version alias.
        """
        with open(self.registry_json_path, 'r', encoding='utf-8') as f:
            registry = json.load(f)
            
        if prompt_name not in registry:
            raise ValueError(f"Prompt {prompt_name} not found in registry.")
            
        resolved_version = registry[prompt_name].get(version)
        if not resolved_version:
            raise ValueError(f"Version alias '{version}' not found for {prompt_name}.")
            
        # Reconstruct path. e.g., youtube_metadata_music -> youtube/metadata/music
        folder_path = prompt_name.replace("_", os.sep)
        prompt_dir = os.path.join(self.registry_dir, folder_path, resolved_version)
        
        prompt_file = os.path.join(prompt_dir, "prompt.txt")
        manifest_file = os.path.join(prompt_dir, "manifest.json")
        
        if not os.path.exists(prompt_file) or not os.path.exists(manifest_file):
            raise FileNotFoundError(f"Missing prompt files at {prompt_dir}")
            
        with open(prompt_file, 'r', encoding='utf-8') as f:
            prompt_text = f.read()
            
        with open(manifest_file, 'r', encoding='utf-8') as f:
            manifest_data = json.load(f)
            
        return {
            "prompt_dir": prompt_dir,
            "prompt_text": prompt_text,
            "manifest": manifest_data,
            "resolved_version": resolved_version
        }
