# Improvement Proposals

An `ImprovementProposal` is an immutable dataclass representing an actionable plan to fix or optimize a component of the AI generation pipeline.

It tracks:
* Candidate (the target layer and proposed change)
* Priority (Low, Medium, High, Critical)
* Risk
* Expected Impact
* Status (Draft, Ready, Approved, Rejected)
