# AI Feedback Engine

The AI Feedback Engine is the deterministic bridge that safely captures user modifications, saves, and performance metrics (telemetry) to produce the normalized Feedback Package.

## Core Rules
1.  **No Generation**: It never calls LLMs.
2.  **No Evaluation**: It only compares strings (Levenshtein distances) and aggregates states.
3.  **No Learning**: It doesn't update models. It simply builds the `FeedbackPackage` payload for Sprint 9.9's Learning Engine.
