# Replay Engine

The `ReplayEngine` is capable of taking a `session_id` and pulling all chronologically sorted events from the active `StorageAdapter`. 
By recreating the entire pipeline offline, developers can debug user journeys (e.g. why a specific Title was discarded) without calling the LLM Provider.
