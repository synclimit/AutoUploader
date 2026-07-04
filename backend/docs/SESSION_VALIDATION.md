# Session Validation

Session Validation acts as an Integrity constraint over the immutable event log.

A session is considered `Complete` and `Valid` if and only if it strictly follows the linear chronological order of execution.
If a `PromptCompiled` event appears before a `KnowledgeResolved` event, the session is flagged as `Corrupted` and isolated from the Learning Engine's training data.
