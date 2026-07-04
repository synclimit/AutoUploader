# Patch Executor

The Patch Executor reads the virtual `ChangePatch` structures from the `ChangePlan` and surgically applies them solely within the Sandbox Manager's ephemeral contexts. It enforces safety boundaries, aborting the sandbox if patches fail to apply cleanly.
