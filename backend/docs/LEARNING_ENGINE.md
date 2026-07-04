# AI Learning Engine

The AI Learning Engine is the analytical intelligence layer. It reads arrays of `FeedbackPackage`s, runs statistical analysis via Pattern Engines, and emits findings.

**Architectural Rule**: The Learning Engine is purely read-only. It NEVER generates metadata, evaluates metadata, or creates Improvement Proposals. It discovers and reports "what is happening" (Findings), leaving the "what should we change" (Proposals) to the Optimizer.
