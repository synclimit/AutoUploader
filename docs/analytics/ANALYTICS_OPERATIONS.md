# Analytics Operations

## Provider Health
Monitors consecutive failures. Implements exponential backoff (3s, 10s, 30s max).
Status transitions: `Healthy` -> `Degraded` -> `Offline`.

## Quota Manager
Maintains API limit count and blocks spam refresh (10s cooldown per channel).
