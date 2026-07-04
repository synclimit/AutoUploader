# AI Decision Engine

The AI Decision Engine is the purely deterministic entity that consumes evaluations from the Review Engine and makes final selection choices.

## Principles
1.  **No Evaluations**: The Decision Engine never measures quality. It trusts the Review Engine.
2.  **No Generation**: It never calls LLMs or rewrites text.
3.  **No Randomness**: Every decision is perfectly traceable via tie-break engines.
