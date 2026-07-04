# Rollback Planner

The Rollback Planner strictly forces a `ChangeRollback` object to be attached to every `ChangePlan`. No experiment runs without an exit plan. It generally involves deleting instantiated experimental layers and restoring prior registry aliases.
