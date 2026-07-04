from typing import List, Tuple
from optimizer.models import ImprovementProposal
from change_planner.models import ChangeAction, ChangeMigration, ChangeRollback, ChangeRisk

class BasePlanner:
    def plan(self, proposal: ImprovementProposal) -> Tuple[List[ChangeAction], ChangeMigration, ChangeRollback, ChangeRisk]:
        raise NotImplementedError

class StrategyPlanner(BasePlanner):
    def plan(self, proposal: ImprovementProposal) -> Tuple[List[ChangeAction], ChangeMigration, ChangeRollback, ChangeRisk]:
        actions = [ChangeAction.CREATE_VERSION, ChangeAction.PATCH_VALUE, ChangeAction.UPDATE_MANIFEST]
        
        migration = ChangeMigration(
            source_version="v1",
            destination_version="v2",
            operations=["Copy Registry", "Apply Patch", "Update Manifest", "Update Version", "Generate Changelog"]
        )
        
        rollback = ChangeRollback(
            operations=["Delete v2", "Restore alias production -> v1", "Restore manifest", "Restore changelog"]
        )
        
        risk = ChangeRisk(
            level="Medium",
            factors=["Changes active logic bounds", "Rollback is fully deterministic"]
        )
        
        return actions, migration, rollback, risk

class PromptPlanner(BasePlanner):
    def plan(self, proposal: ImprovementProposal) -> Tuple[List[ChangeAction], ChangeMigration, ChangeRollback, ChangeRisk]:
        actions = [ChangeAction.CREATE_VERSION, ChangeAction.PATCH_VALUE, ChangeAction.UPDATE_MANIFEST]
        
        migration = ChangeMigration(
            source_version="v1",
            destination_version="v2",
            operations=["Copy Prompt Base", "Apply Patch", "Update Manifest", "Generate Changelog"]
        )
        
        rollback = ChangeRollback(
            operations=["Delete v2", "Restore prompt registry config"]
        )
        
        risk = ChangeRisk(
            level="Low",
            factors=["Only affects Prompt layer", "No cascading dependency effects expected"]
        )
        
        return actions, migration, rollback, risk
