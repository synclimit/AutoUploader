# Event Coverage

The Event Coverage auditor verifies that every stage of the pipeline produces its respective metric.
This acts as a CI/CD safety net. If a developer accidentally removes the `EventBus.publish()` call from the `PromptCompiler`, the auditor will fail with:

`Prompt Compiler: FAIL (Missing PromptCompilationStarted)`
