import re
import json
import os

class PromptLinter:
    @staticmethod
    def lint_prompt(prompt_dir: str) -> dict:
        prompt_file = os.path.join(prompt_dir, "prompt.txt")
        manifest_file = os.path.join(prompt_dir, "manifest.json")

        errors = []
        warnings = []
        
        # 1. Check if files exist
        if not os.path.exists(prompt_file):
            errors.append("Missing prompt.txt")
            return {"valid": False, "errors": errors, "warnings": warnings}
            
        if not os.path.exists(manifest_file):
            errors.append("Missing manifest.json")
            return {"valid": False, "errors": errors, "warnings": warnings}

        # 2. Check empty prompt
        with open(prompt_file, 'r', encoding='utf-8') as f:
            prompt_text = f.read()
            
        if not prompt_text.strip():
            errors.append("Empty prompt")
            
        # 3. Check JSON manifest
        try:
            with open(manifest_file, 'r', encoding='utf-8') as f:
                manifest_data = json.load(f)
        except json.JSONDecodeError:
            errors.append("Invalid manifest (Invalid JSON)")
            return {"valid": False, "errors": errors, "warnings": warnings}
            
        # 4. Check variables
        declared_variables = manifest_data.get("variables", [])
        if not isinstance(declared_variables, list):
            errors.append("Manifest 'variables' must be a list")
            declared_variables = []
            
        # Find all placeholders like {var_name}
        found_placeholders = re.findall(r'\{([a-zA-Z0-9_]+)\}', prompt_text)
        
        for var in declared_variables:
            if var not in found_placeholders:
                warnings.append(f"Unused variable: {var}")
                
        for var in found_placeholders:
            if var not in declared_variables:
                errors.append(f"Unknown variable in prompt: {var}")
                
        # Duplicate placeholders
        placeholder_counts = {}
        for var in found_placeholders:
            placeholder_counts[var] = placeholder_counts.get(var, 0) + 1
            
        for var, count in placeholder_counts.items():
            if count > 1:
                warnings.append(f"Duplicate placeholder: {var} (found {count} times)")

        # Length and complexity warnings
        if len(prompt_text) > 4000:
            warnings.append("Prompt length warning: Over 4000 characters")
            
        if len(declared_variables) > 10:
            warnings.append("Prompt complexity warning: Over 10 variables")

        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
