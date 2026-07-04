# Project Handover

Welcome to the AutoUploader project. This document provides critical context for any AI developer taking over development.

# Project History
AutoUploader began as a backend-first automation tool to manage bulk YouTube uploads without relying on the restrictive YouTube Data API quota limits. To achieve this, it uses a Playwright-driven headless/remote Chrome instance (via CDP) to manually click through the YouTube Studio UI. The project consists of a FastAPI + SQLite backend, a Redis task queue, and a React + Vite frontend for monitoring.

# Major Decisions
* **Playwright over Official API**: The YouTube Data API has strict quota limits for uploads. Using Playwright to automate the browser mimics human behavior and avoids quota restrictions.
* **CDP (Chrome DevTools Protocol)**: Instead of launching a fresh browser context, Playwright connects to a persistent, manually-authenticated local Chrome instance on port 9222.
* **Redis Task Queue**: Decouples the scheduling of uploads from actual browser execution.
* **Component-State Routing**: The React frontend intentionally avoids `react-router-dom` in favor of simple conditional rendering.

# What Is Already Proven Working (Current Verified Status)
* **Upload Engine**: WORKING. The Playwright CDP connection logic reliably pushes videos to YouTube.
* **Scheduler Engine**: WORKING. Background threads successfully spin up and trigger tasks.
* **Queue Engine**: WORKING. The state machine correctly transitions tasks.
* **Watch Folder Engine**: WORKING.
* **Upload Logs**: WORKING.
* **Database Consolidation**: COMPLETED (`app_v2.db` is active).
* **Frontend UI Phase A/B**: COMPLETE. History module deprecated, replaced with distinct Logs, Uploads, and simplified Queue modules.
* **Metadata Completion (Phase 5A)**: COMPLETE. End-to-end flow verified for: `title`, `description`, `tags`, `privacy_status`, `made_for_kids`, `thumbnail`, `youtube_video_id`, `youtube_url` (Video ID: `P5xKVAc1njk`).
* **Upload Results Visibility (Phase 5B)**: COMPLETE. Frontend visibility implemented for `youtube_video_id`, `youtube_url`, `started_at`, `completed_at`, `retry_count`, and `failure_reason`.
* **Multi Account OAuth Audit (Phase 6A)**: COMPLETE.
  * Single Google account can own multiple YouTube channels.
  * OAuth does not return channel_id directly.
  * channel_id must be discovered using: `channels().list(mine=true)`
  * Recommended token strategy: `tokens/accounts/{account_id}.pickle`
  * Recommended workflow: Create Account -> Connect OAuth -> Discover Channel -> Show Channel Name + Channel ID -> User Confirms -> Save Token -> Save channel_id

# Known Warnings & Bugs
* **Dashboard Mock Data**: Dashboard still contains mock data.
* **Backend Wiring**: Some logs/history screens still need real backend wiring.
* **PRODUCTION CRITICAL COMPONENTS**:
  * Upload Engine is production-critical. Do NOT rewrite.
  * Scheduler Engine is production-critical. Do NOT rewrite.
  * Queue state machine is production-critical. Do NOT rewrite.

# Recommended Next Steps
1. **Proceed with Phase 6B Multi Account OAuth Implementation Plan**:
   * *Rationale*: Design the schema additions (token paths, channel IDs), callback routes, token loader logic, and backward compatibility migration strategies before modifying backend/frontend engines.
2. Avoid touching the core proven engines (Upload, Scheduler, Queue) during design/design plan.
3. Wire the remaining React frontend views to fetch live data from the FastAPI backend.
