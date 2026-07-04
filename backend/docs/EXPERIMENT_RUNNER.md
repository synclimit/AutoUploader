# AI Experiment Runner

The AI Experiment Runner is the execution engine responsible for safely validating `ChangePlan`s in a fully isolated sandbox.

**MANDATORY RULE**: The Experiment Runner MUST NEVER modify production assets, MUST NEVER promote results to live registries, and MUST NEVER update production aliases. Its absolute boundary is the destruction of its temporary Sandbox upon emitting an `ExperimentResult`.
