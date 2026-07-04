# Storage Adapter Pattern

The `TelemetryRecorder` does not care where data goes. It accepts an injected `StorageAdapter` at runtime.

Currently supported adapters:
1. `SQLiteStorageAdapter`: High-performance local SQL database, ideal for `telemetry-dashboard` querying.
2. `JSONLStorageAdapter`: Text-based, append-only logs ideal for debugging.

Future integrations like PostgreSQL and ClickHouse can be added without modifying a single line of AI logic.
