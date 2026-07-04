# AI Optimizer Engine

The Optimizer Engine acts as the final autonomous intelligence layer of the AI Operating System. Its fundamental purpose is to bridge the gap between "What happened" (Learning Engine) and "What should we do" (Human-approved Experiments).

It converts `LearningReport` anomalies into deterministic `ImprovementProposal`s with clear risk, impact, and expected metrics.

**MANDATORY RULE**: The Optimizer is strictly prohibited from mutating any actual generation strategies, prompts, or codebases. It is only authorized to write its Proposals into the `OptimizerRepository` under a `Draft` status.
