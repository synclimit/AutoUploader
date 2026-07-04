# Telemetry Engine

The Telemetry Engine acts as the immutable historical memory for the entire AI Operating System.
It tracks the full lifecycle of every metadata generation request, right down to the user's manual edits and upload events.

## Core Rules
1. **Append-Only**: Telemetry events can never be deleted or modified.
2. **AI Independence**: Telemetry never performs LLM operations or modifies business objects.
3. **Event Bus Driven**: No AI service writes directly to a database. They only publish to the `EventBus`.
