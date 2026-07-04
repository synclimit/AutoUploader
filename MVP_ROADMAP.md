# MVP Roadmap

## COMPLETED
* **Database Consolidation**: Unified SQLite connection (`app_v2.db`).
* **Queue Engine**: Queue Workflow E2E task states transitioning successfully.
* **Scheduler Engine**: Interval-based polling background service.
* **Watch Folder Engine**: Local directory scanning verified.
* **Upload Logs**: Append-only log tracking.
* **Real YouTube Upload**: E2E browser automation confirmed working (Verified Video ID: `P5xKVAc1njk`).
* **Metadata Completion (Phase 5A)**: Wiring UI fields to API and Database to reach YouTube payload. Verified fields: `title`, `description`, `tags`, `privacy_status`, `made_for_kids`, `thumbnail`, `youtube_video_id`, `youtube_url`.
* **Upload Results Visibility (Phase 5B)**: Exposing `youtube_video_id`, `youtube_url`, `started_at`, `completed_at`, `retry_count`, `failure_reason` in the UI (completed task visibility & failure status blocks on cards).
* **UI Simplification Phase A/B**: Refactored navigation (Dashboard, Uploads, Queue, Accounts, Logs, Settings), deprecated History, created Logs/Uploads modules, simplified Queue.
* **Multi Account OAuth Audit (Phase 6A)**: COMPLETED
  * Single Google account can own multiple YouTube channels.
  * OAuth does not return channel_id directly.
  * channel_id must be discovered using: `channels().list(mine=true)`
  * Recommended token strategy: `tokens/accounts/{account_id}.pickle`
  * Recommended workflow: Create Account -> Connect OAuth -> Discover Channel -> Show Channel Name + Channel ID -> User Confirms -> Save Token -> Save channel_id
## IN PROGRESS
* **Multi Account OAuth Implementation Plan (Phase 6B)**: Creating the technical implementation plan for:
  1. Database changes
  2. API endpoints
  3. OAuth callback flow
  4. Token storage architecture
  5. Upload Engine integration
  6. Migration strategy from legacy youtube_token.pickle
  7. Verification plan

## NEXT PRIORITY CANDIDATES (Choose One)
* **Retry Engine Auto Retry**: Fully automated failure handling. Reused existing database fields (`retry_count`, `failure_reason`). Hardens current single-channel operation immediately with low risk.
* **Multi Account OAuth (Phase 6C)**: Coding and implementing the multi-account backend credentials database, frontend OAuth link workflow, and token mapping engine.

## NOT STARTED
* **Final UI Redesign**: Polishing the visual dashboard beyond the core refactor.
* **AI Layer Integration**: Gemini LLM logic for automated metadata generation.

## Features that should NOT be worked on right now
* AI-first content creation or advanced metadata generation via LLMs.
* Overly complex frontend animations or dashboard refactoring.
* Deploying the browser automation to the cloud.
* Support for platforms other than YouTube.
