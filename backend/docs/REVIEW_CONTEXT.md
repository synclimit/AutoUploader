# Review Context

`ReviewContext` is an immutable, frozen dataclass that encapsulates the result of a single Candidate's evaluation.
It contains the aggregate score, the 10 individual engine scores, any warnings, recommendations, and whether or not this specific candidate won the comparison shootout.
