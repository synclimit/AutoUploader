# Analytics API Reference

## Base Path
`/api/v1/analytics`

## Endpoints
1. `GET /dashboard/{account_id}`: Returns lightweight metrics for the dashboard.
2. `GET /overview/{account_id}`: Returns heavy analytics for the workspace.
3. `GET /charts/{account_id}?days=28`: Returns time-series chart data.
4. `GET /videos/{account_id}?limit=50&pageToken=XYZ`: Cursor paginated video list.
