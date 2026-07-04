# Decision Profiles

Decision Profiles define `decision.json`. They dictate:
1. `weights`: Determines which Review Engine heuristics matter most.
2. `rules`: Minimum thresholds (e.g. Reject candidates with high clickbait).
3. `tie_break_priority`: Strict sequential deterministic resolution order.
4. `fallback`: Graceful fallback if no candidates survive the thresholds.
