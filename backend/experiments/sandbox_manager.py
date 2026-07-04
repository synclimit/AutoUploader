import uuid
from typing import Dict

class SandboxManager:
    def __init__(self):
        self.active_sandboxes: Dict[str, dict] = {}

    def create_sandbox(self) -> str:
        sandbox_id = f"SBX-{uuid.uuid4().hex[:6].upper()}"
        self.active_sandboxes[sandbox_id] = {
            "registries": {},
            "prompts": {},
            "strategies": {},
            "knowledge": {}
        }
        return sandbox_id

    def clone_registry(self, sandbox_id: str, registry_name: str, version: str):
        if sandbox_id not in self.active_sandboxes:
            raise ValueError("Invalid sandbox ID")
            
        # Virtual clone of registry for isolation
        self.active_sandboxes[sandbox_id]["registries"][registry_name] = f"cloned_from_{version}"

    def destroy_sandbox(self, sandbox_id: str):
        if sandbox_id in self.active_sandboxes:
            del self.active_sandboxes[sandbox_id]
