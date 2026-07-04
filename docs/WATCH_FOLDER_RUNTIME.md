# Watch Folder Runtime Integration

## Overview

The Watch Folder Runtime has been refactored in Sprint 10.4.2 to fully support multi-pipeline concurrency (`Long` and `Shorts`) while maintaining the strict boundaries defined by the AI Operating System architecture. 

The architecture strictly dictates that each engine operates within its isolated responsibility matrix. The Watch Folder engine handles package ingestion, the Scheduler engine assigns upload times based on the mode, and the Upload engine handles YouTube API communication.

---

## 1. Pipeline Independence

The Watch Folder Engine now executes its core routines (scanning, daily intake counting, duplicate checking, validation) per-pipeline. Each account defines its pipeline config in the `pipelines` JSON block. 

### Key Characteristics:
* **Separation of Quotas:** Daily limits (`daily_limit`) are counted and maintained individually per pipeline (e.g., Long videos don't consume Shorts quota).
* **Targeted Scanning:** The `scan_now` functionality supports executing forced scans on a single pipeline without affecting others.
* **Isolated Health Reporting:** System status, metrics (packages found, imported, skipped), and live execution logs are segregated by pipeline in the `WatchFolderHealthService`.

## 2. Strict Architectural Boundaries

No Engine logic was allowed to bleed into another Engine's territory during this refactor.

### Watch Folder Engine (`engine.py`)
* Responsibilities: Reading folders, validating, running duplicate checks, monitoring daily limit quotas, generating tasks with initial metadata.
* Strict Rule Maintained: Watch folder generates `UploadTask` records exclusively with the `status="WATCHED"` (which conceptually maps to WAITING). It **does not** compute the `scheduled_at` times.

### Application Scheduler Engine (`upload_scheduler.py`)
* Responsibilities: Detecting `WATCHED` tasks where `scheduled_at` is empty, reading pipeline configurations (e.g., `schedule_mode`, `schedule_time`), and making state transition decisions.
* YouTube Mode: If `schedule_mode == "youtube"`, the scheduler computes the time, assigns `scheduled_at`, and immediately bumps the task to `QUEUED` so it's handed off to the Upload Engine.
* Application Mode: If `schedule_mode == "application"`, the scheduler assigns the computed `scheduled_at` and pushes the task to `SCHEDULED`, waiting for the local machine's wall clock to reach the scheduled time before transitioning to `QUEUED`.

## 3. Transparency and Telemetry

### Execution Log
Each pipeline maintains an in-memory rotating Execution Log (max 10 entries) that captures real-time events during the scanning loop. Events are prefixed with `[PASS]` or `[FAIL]` and provide real-time UI visibility for the operator.

### UI Enhancements (`WatchFolderHealthPanel.jsx`)
The frontend Dashboard Health Panel has been completely rewritten to dynamically display cards for each active pipeline in an account. Each card surfaces its independent statistics (limit, imported today, pending packages) along with its specific Execution Log.
