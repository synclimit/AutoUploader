import os
import re

class PromptManager:
    PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "youtube", "metadata")

    @classmethod
    def get_prompt(cls, content_type: str) -> dict:
        """
        Reads the appropriate prompt file based on the content type.
        Returns a dict with 'name', 'version', 'description', and 'template'.
        """
        # Map frontend content type to filename
        ct_map = {
            "General": "general.txt",
            "Music": "music.txt",
            "Gaming": "gaming.txt",
            "Education": "education.txt",
            "Podcast": "podcast.txt",
            "Relaxation": "relaxation.txt"
        }
        
        filename = ct_map.get(content_type, "general.txt")
        file_path = os.path.join(cls.PROMPTS_DIR, filename)
        
        if not os.path.exists(file_path):
            file_path = os.path.join(cls.PROMPTS_DIR, "general.txt")
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        # Parse frontmatter
        meta = {
            "name": "Unknown Prompt",
            "version": "v1.0",
            "description": "",
            "template": content
        }
        
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                frontmatter = parts[1]
                meta["template"] = parts[2].strip()
                
                # Extract meta
                for line in frontmatter.strip().split("\n"):
                    if ":" in line:
                        k, v = line.split(":", 1)
                        k = k.strip()
                        v = v.strip().strip('"').strip("'")
                        meta[k] = v
                        
        return meta
