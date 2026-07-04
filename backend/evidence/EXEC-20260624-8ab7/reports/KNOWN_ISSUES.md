# Known Issues

Grouped by severity as requested.

## Critical
None. The architecture is stable and handles connection timeouts and authentication failures gracefully without crashing the queue thread.

## High
None. 

## Medium
### 1. Missing Visual Playwright Error Snapshots
- **Description**: When `PlaywrightUploader` fails, it currently relies on textual logs and standard exceptions. It does not automatically dump a screenshot of the YouTube Studio error state.
- **Impact**: Harder debugging if Google changes its DOM structure.
- **Reproduction Steps**: Execute a task with an outdated Studio layout.
- **Workaround**: None currently.
- **Planned Resolution**: Implement a global Page error interceptor inside `BrowserLauncher` to take screenshots on failure and store them in `evidence/workflow`.

## Low
### 1. `PlaywrightUploader` hardcodes profile name
- **Description**: `profile_name` is currently hardcoded to `"youtube_automation"` in `playwright_provider.py` instead of dynamically fetching `context.account.browser_profile`.
- **Impact**: Prevents testing multiple profiles concurrently.
- **Reproduction Steps**: Create multiple accounts with different profiles; they will all use the same directory.
- **Workaround**: Manually ensure `browser_profiles/youtube_automation` is swapped or logged into the correct channel.
- **Planned Resolution**: Dynamically map `context.browser_profile_path` into the provider in the next bug-fix sprint.

## Won't Fix
### 1. Playwright Two-Factor Authentication Prompt Avoidance
- **Description**: Attempting to bypass Google login constraints programmatically using Playwright interactions.
- **Impact**: Would break constantly due to Google heuristics.
- **Workaround**: Use the `setup_profile.py` manual auth workflow.
- **Planned Resolution**: None. We embrace manual initial profile authentication.
