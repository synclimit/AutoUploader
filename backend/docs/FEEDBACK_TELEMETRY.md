# Feedback Telemetry

The Feedback Engine leverages the `EventBus` to emit granular telemetry for dashboard rendering and chronological `trace-feedback` tracking:

Events:
1. `FeedbackStarted`
2. `FeedbackCollected`
3. `ManualEditDetected`
4. `UserOverrideDetected`
5. `FeedbackNormalized`
6. `FeedbackCompleted`
