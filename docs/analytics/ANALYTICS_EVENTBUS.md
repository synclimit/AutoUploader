# Analytics Event Bus

## Purpose
Decouples background refresh cycles from active UI components. When the background poller detects changes, it broadcasts an event.

## Supported Events
- `AnalyticsUpdated`: Triggered when cache is updated.
- `ProviderHealthChanged`: Triggered when provider status shifts.
- `QuotaUpdated`: Triggered when significant quota usage occurs.
