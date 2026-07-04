# Telemetry Analytics

The `TelemetryAnalytics` engine consumes raw events from the Storage Adapter and computes macroscopic statistics for the `telemetry-dashboard` CLI tool.
It automatically calculates:
- Average runtimes per module.
- Success/Failure rates.
- Provider popularity and total cost estimations.
- Average user edit distances.
