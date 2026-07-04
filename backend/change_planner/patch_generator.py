from typing import List
from change_planner.models import ChangePatch

class PatchGenerator:
    def __init__(self, templates: dict):
        self.templates = templates

    def generate(self, target_layer: str, proposed_change: str) -> List[ChangePatch]:
        patches = []
        
        # Example deterministic logic for patches based on the proposal
        if "Length Target" in proposed_change:
            patches.append(ChangePatch(
                operation="replace",
                path="title_length",
                current_value="70",
                new_value="58"
            ))
        elif "Prompt v2" in proposed_change:
            patches.append(ChangePatch(
                operation="replace",
                path="tone",
                current_value="casual",
                new_value="professional"
            ))
            
        return patches
