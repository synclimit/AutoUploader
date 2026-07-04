# Optimizer Approval Workflow

Every ImprovementProposal is born in the `DRAFT` state.

It can only be advanced to `READY` or `APPROVED` via human intervention. Once approved, it proceeds to the `ExperimentRunner` (which runs via Prompt Laboratory). If the experiment passes regression and proves successful, the proposal is marked `PROMOTED` and can be manually merged into the production strategy/prompt registries.
