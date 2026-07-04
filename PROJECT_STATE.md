# Project Overview
AutoUploader is a YouTube video upload automation tool. Its primary goal is to provide a reliable, backend-first engine to scan local folders, manage metadata via templates, schedule uploads, and automate the YouTube Studio upload process using a Playwright-controlled Chromium browser.

# Current Architecture

## Frontend
* **Framework**: React 19, Vite 8
* **State management**: React Component State, Axios for API data fetching
* **Routing**: Single-page layout using component state (no external router like React Router)
* **UI libraries**: Tailwind CSS 4
* **New Navigation**: Dashboard, Uploads, Queue, Accounts, Logs, Settings
* **UI Refactor Phase A**: COMPLETE
* **UI Refactor Phase B**: COMPLETE
* **Module Updates**: History module deprecated, Logs module created, Uploads module created, Queue module simplified.

## Backend
* **Framework**: FastAPI
* **ORM**: SQLAlchemy
* **Database**: SQLite (`app_v2.db` is the ACTIVE DATABASE)
* **Background services**: Background threads for Watch Folder, Upload Scheduler, and Playwright CDP automation. Redis is utilized for task queuing.
* **Database Consolidation**: COMPLETED

# Current Engines (VERIFIED STATUS)

## Upload Engine
* **Current status**: WORKING (Production-critical. Do not rewrite.)
* **Real YouTube Upload**: WORKING (Verified Video ID: `P5xKVAc1njk`)

## Scheduler Engine
* **Current status**: WORKING (Production-critical. Do not rewrite.)

## Watch Folder Engine
* **Current status**: WORKING

## Queue Engine
* **Current status**: WORKING (State machine is production-critical. Do not rewrite.)

## Upload Logs
* **Current status**: WORKING

## Metadata Completion (Phase 5A)
* **Current status**: COMPLETE (Verified end-to-end flow for: title, description, tags, privacy_status, made_for_kids, thumbnail, youtube_video_id, youtube_url)

## Upload Results Visibility (Phase 5B)
* **Current status**: COMPLETE (Verified frontend exposure for: `youtube_video_id`, `youtube_url`, `started_at`, `completed_at`, `retry_count`, `failure_reason`)

## Multi Account OAuth Audit (Phase 6A)
* **Current status**: COMPLETE
  * Single Google account can own multiple YouTube channels.
  * OAuth does not return channel_id directly.
  * channel_id must be discovered using: `channels().list(mine=true)`
  * Recommended token strategy: `tokens/accounts/{account_id}.pickle`
  * Recommended workflow: Create Account -> Connect OAuth -> Discover Channel -> Show Channel Name + Channel ID -> User Confirms -> Save Token -> Save channel_id

# Known Warnings & Technical Debt
* **Dashboard Mock Data**: Dashboard still contains mock data.
* **Backend Wiring**: Some logs/history screens still need real backend wiring.
* **Immutable Engines**: Upload Engine, Scheduler Engine, and Queue state machine are production-critical. Do not rewrite them.
