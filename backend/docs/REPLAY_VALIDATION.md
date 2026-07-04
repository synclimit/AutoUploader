# Replay Validation

Because the AI pipelines are fully deterministic and telemetry stores exact state variables (like fallback strategies, prompt hashes, and runtimes), the Replay Engine perfectly recreates the session.

If the replayed session differs from the actual recorded state in any way, the session is marked as `Invalid`. This enforces strict determinism.
