# Strategy Roadmap

1. **Sprint 9.5: Strategy Engine (Current)**
   Implement the core architecture: `StrategyContext`, independent strategy modules (Goal, Title, Description, Tags, Thumbnail, Language), `StrategyValidator`, and Prompt Compiler integration.

2. **Future: Strategy Learning & Optimization**
   - The Learning Engine (Phase D) will parse the `confidence` scores assigned by the Strategy Engine to self-correct rules over time.
   - The Candidate Ranking Engine (Sprint 9.7) will validate generated results against the deterministic rules declared in `StrategyContext`.
   - Autonomous A/B testing will inject mutations into the Strategy Context (e.g., swapping `hook: question` for `hook: dramatic`) without changing the underlying knowledge.
