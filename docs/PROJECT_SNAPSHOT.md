# AutoUploader Project Snapshot

## Overall Architecture Snapshot

### UPLOAD MODULE
- Scan Folder (Folder-based Watch Engine)
- Upload Video
- M1 Workflow (video.mp4, thumbnail.jpg, metadata.json)
- M1 Fetch Strategy (Retrieves Title, Description, Thumbnail, Channel Name, Duration, Video ID)
- M3 Workflow (+ timestamps.txt)
- Gemini Integration
- Queue Statuses (PENDING_REVIEW, QUEUED, SCHEDULED, UPLOADING, SUCCESS, FAILED, CANCELLED)
- Humanized Scheduler
- Future Upload Task Model (video_path, thumbnail_path, metadata_path, timestamps_path, source_type, metadata_source, immutable metadata snapshot)

### WATCH FOLDER ENGINE (Architecture FINAL — Stage 3.5.1)
- **Scan Mode**: Polling, configurable interval (default: 15s)
- **Required files**: `video.mp4` AND `metadata.json` (both hard-required — hard fail if either absent)
- **Optional files**: `thumbnail.jpg`, `timestamps.txt` (graceful degradation)
- **No degraded import**: If required files missing, package is rejected with explicit log message
- **No sentinel file**: AutoUploader never writes files into renderer output folders
- **DB is sole source of truth** for import tracking
- **Duplicate primary key**: `video_id` from metadata.json (stable across folder moves/renames)
- **Duplicate secondary**: `package_folder` path (anti-stale rescan guard only)
- **Duplicate conflict**: Surface warning to user → user decides Skip or Import Anyway
- **duplicate_risk flag**: Boolean on UploadTask, true when user overrides duplicate warning
- **ERROR state**: Retries on every scan interval, auto-recovers when path returns. Never auto-disables.
- **State machine**: `IDLE → SCANNING → VALIDATING → DUPLICATE_CHECK → IMPORTING` (+ `PAUSED`, `ERROR`)
- **Background**: asyncio task, starts on FastAPI startup if any account has watch enabled
- **Gemini**: **Explicitly excluded** — engine never triggers any Gemini call under any condition
- **Filesystem policy**: Engine never writes to, modifies, or deletes any file in renderer output folders
- **Health Panel**: Watch Folder Health sub-panel on Account Detail (status, last scan, last import, imported count, error count, pending decisions)
- **Schema additions**: `video_id` (nullable String) + `duplicate_risk` (nullable Boolean) on UploadTask

### M1/M3 DATA CONTRACT V2 (Stage 3.5.1 Revision)
- **Folder-Based Package Rule**: 1 Folder = 1 Upload Package (avoids asset mismatches)
- **Thumbnail Rule**: Local `thumbnail.jpg` is primary. No downloading from `thumbnail_url`.
- **Title Final Rule**: `metadata.json` must contain `title_final`. Renderers own the title generation strategy.
- **metadata.json Required**: Promoted from RECOMMENDED to REQUIRED in Stage 3.5.1. Pipeline depends on title_final, description, video_id, source_channel, source_url.
- **Metadata Source**: Always `RENDERER` for Watch Folder imports (no fallback to PROFILE or MANUAL)

### ACCOUNTS MODULE (IMPLEMENTED)
- Channel Accounts
- Source Type
- Watch Folder (path + enabled toggle, Browse button Coming Later)
- Region
- Authentication
- Profile Binding

### PROFILES MODULE
- Title Templates
- Description Templates
- Tags Templates (with # guidance)
- Bulk Import (with helper text)
- Preview System (dynamically bound to selected profile)
- Template Variables
- Gemini API Mode + Approval Queue (create/edit parity)

### SETTINGS MODULE
- Gemini API (editable key input)
- Gemini Usage Monitor
- Watch Folder Engine (global scan settings)
- Backup & Recovery
- Retry Engine
- Cache Cleanup

### UPLOAD QUEUE MODULE
- Queue Panel (tasks list)
- Detail Panel (metadata editor + upload settings)
- Empty State (explanatory text about Watch Folder Engine)
- Scan Folder button → COMING IN STAGE 3.5
- Upload Video button → COMING IN FUTURE ENGINE

### DASHBOARD
- Queue Overview
- Critical Issues
- Operational Metrics

### HISTORY
- Upload Archive (filters: status, source, date range)
- Metrics (Total Uploads, Failed, Retry Rate, Avg Process Time)
- Analytics Summary
- Hooks ordering bug fixed (Stage 3.4.4)
