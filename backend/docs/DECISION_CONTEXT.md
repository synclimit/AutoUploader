# Decision Context

`DecisionContext` is the immutable, frozen dataclass tracking the final chosen candidate and its ranking over all other candidates.

It contains:
* `session_id` & `decision_id`
* `optimization_goal` & `profile_version`
* `selected_candidate`
* `ranking`
* `confidence`
* `reasoning` (Structured justification)
* `fallback_used`
