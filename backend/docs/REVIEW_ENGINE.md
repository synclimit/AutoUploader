# AI Review Engine

The Review Engine serves as the ultimate Quality Gate for LLM generation. 
It strictly separates "Thinking" (Knowledge + Strategy) and "Writing" (Prompt + LLM) from **"Evaluating"** (Review).

The Review Engine operates entirely deterministically through 10 modular heuristics and regex-based Scoring Engines.
It never performs generations and never attempts to fix or rewrite text. It solely ranks the LLM's candidates and chooses the best one based on the current Context.
