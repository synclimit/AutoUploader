# AI Change Planner

The AI Change Planner acts as the architectural bridge between the AI Optimizer Engine and the Experiment Runner. It takes abstract `ImprovementProposal`s (e.g. "Reduce Title Length") and deterministically translates them into exact deployment blueprints (`ChangePlan`s).

**MANDATORY RULE**: The Change Planner is strictly a blueprint generator. It is completely isolated from execution. It MUST NEVER edit production files, modify registries, or execute experiments. Its sole domain is generating `ChangePlan` objects.
