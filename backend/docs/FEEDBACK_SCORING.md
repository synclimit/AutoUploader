# Feedback Scoring

Feedback Scoring rules are dictated by `feedback.json`. The `FeedbackScoreEngine` maps the user's manual string manipulations (`edit_distance_pct`) to hard `feedback_score` values. 

For instance, 0 edits = 100 points. <5% edits = 95 points. Discarded = 0 points.
This score is dynamically weighted with the `PerformanceEngine` score to build the final `overall_score`.
