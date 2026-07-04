# Change Plan

A `ChangePlan` is the ultimate deterministic blueprint that guides an experiment deployment. It is an immutable, frozen dataclass ensuring absolute structural integrity before execution.

It contains:
* `dependencies`: Required registry layers and versions.
* `patches`: Exact diff structures (current value vs new value).
* `migration`: Steps to instantiate the new component.
* `rollback`: Steps to abort and safely destroy the test environment.
* `risk`: Analytical safety constraints.
* `validation`: Assurance that the blueprint adheres to systemic tolerances.
