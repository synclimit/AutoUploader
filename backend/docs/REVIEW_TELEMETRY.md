# Review Telemetry Integration

The Review Engine pushes five distinct lifecycle events to the `EventBus`:

1. `ReviewStarted`
2. `CandidateScored`
3. `CandidateRejected`
4. `CandidateWinner`
5. `ReviewCompleted`

These events allow the Timeline explorer (`telemetry-session`) to prove exactly why a specific generation candidate was chosen over the others.
