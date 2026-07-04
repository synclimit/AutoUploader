# Strategy Engine

The Strategy Engine is responsible for determining **how** content should be formatted, written, and structured, separating stylistic decisions from the Prompt (which handles templating) and the Knowledge Layer (which handles domain logic).

## Architecture

The Strategy Layer operates as a sequence of independent module engines:
`Goal Engine -> Title Engine -> Description Engine -> Tags Engine -> Thumbnail Engine -> Language Engine -> Validator`

Every engine produces a deterministic output with a `confidence` score and a `reason`, which are merged into a single, immutable `StrategyContext`.

## The StrategyContext Object

Once the pipeline concludes, the `StrategyContext` is completely immutable. No prompt, LLM, or downstream critic is allowed to mutate it. Any change in strategy requires executing the pipeline again to produce a new object.
