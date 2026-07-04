# Event Bus Architecture

The `EventBus` provides a pub/sub mechanism to entirely decouple AI Components from observability storage.

## Usage
When `PromptCompiler` finishes generation, it executes:
`EventBus.publish(GenerationCompleted(session_id, corr_id, metadata))`

The `EventBus` then routes this instance to all subscribers (e.g. `TelemetryRecorder`, and eventually `NotificationCenter` or `LearningEngine`).
