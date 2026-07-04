import os

class ProfileManager:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir

    def resolve_profile_path(self, profile_name: str) -> str:
        path = os.path.join(self.base_dir, "browser_profiles", profile_name)
        if not os.path.exists(path):
            os.makedirs(path, exist_ok=True)
        return path

    def validate_profile(self, profile_path: str) -> bool:
        # Check if basic profile structures exist
        return os.path.isdir(profile_path)
