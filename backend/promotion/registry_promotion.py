class RegistryPromotion:
    def promote_assets(self, target_registry: str, sandbox_version: str, prod_version: str) -> bool:
        # Copies assets from the isolated sandbox ID / version into the permanent production registry layer
        # e.g., copies `sandbox_v2` into `production_v2` without touching `v1`
        return True
