# Analytics Workflow

## Frontend Flow
1. User navigates to Dashboard or Analytics Workspace.
2. Component triggers `analyticsStore.fetchDashboard(id)`.
3. `analyticsStore` checks if data exists. If forced, it bypasses local cache and hits API.

## Backend Flow
1. API receives request.
2. Gateway routes to Service.
3. Service checks Quota. If quota exhausted, throws error.
4. Service checks Cache. If found, returns immediately.
5. Service fetches via Provider plugin.
6. Service saves to cache and broadcasts EventBus.
