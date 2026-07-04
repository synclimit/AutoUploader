# Telemetry Integration

Telemetry is deeply integrated into the AI Pipeline via the Event Bus.

The following components naturally emit events without modifying any internal state or calling third-party APIs:
1. `ContextBuilder` (`KnowledgeStarted`, `KnowledgeResolved`)
2. `StrategyBuilder` (`StrategyStarted`, `StrategyResolved`)
3. `PromptCompiler` (`PromptCompilationStarted`, `PromptCompiled`)
