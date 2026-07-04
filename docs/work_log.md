# Work Log & UI Decisions

## Stage 2 Closure Summary

### Major UI Decisions
- **Shared Architecture**: Account Create and Account Detail share the exact same UI structure to prevent maintenance drift.
- **Table of Contents Navigation**: Settings and Profile panels utilize an IntersectionObserver-driven smooth-scrolling Table of Contents for seamless navigation.
- **Dark Mode Native Selects**: Overrode Windows default white backgrounds on all `<select>` components using a custom dark theme `#141821` implementation.
- **Space Efficiency**: Aggressively compacted the system status cards throughout the application to free up maximum vertical space for operational panels. No nested scrollbars allowed.

### Removed Features
- **Upload Quota**: Removed from Account forms.
- **Fixed Schedule Template**: Replaced with Humanized Scheduler and Upload Windows.
- **Raw Auth Tokens**: Replaced with placeholder 'Connect Account' buttons.
- **OCR Thumbnail Reader**: Legacy workflow removed entirely.
- **Global Render Mode & Workspace Mode**: Pruned from global settings to simplify application scope.
- **Render Sources**: Moved out of Settings and into Profile/Account scopes, recognizing that paths differ per channel.

### Stage 3.2: Profiles Backend Implementation
- Set up SQLite with `foreign_keys=ON`
- Created SQLAlchemy models for `Profile` and `ProfileTemplate`
- Created FastAPI CRUD endpoints and Bulk Import endpoints for profiles and templates
- Implemented Zustand store (`profileStore.ts`) to consume the API
- Wired up `ProfileDetailPanel`, `ProfileCreateForm`, and `ProfilesWorkspacePanel` to the store
- Added UI toast notifications for CRUD and bulk import operations

### Stage 3.3.2: Accounts Backend Implementation
- Implemented SQLite `Account` table with `schema_version`
- Built FastAPI CRUD for accounts with unified `PUT` update endpoint
- Configured Foreign Key binding from Accounts to Profiles
- Replaced frontend mock data in `accountsStore.ts` with real API calls
- Updated `AccountsPanel`, `AccountCreateForm`, and `AccountsOverviewPanel` to integrate backend state
- Enforced Watch Folder uniqueness and populated `profile_name` in list responses

### Documentation Updates before Stage 3.3
- Documented future **folder-based output structure** for M1/M3 workflows.
- Defined **Watch Folder Rule**: must monitor folders (not individual MP4s) to ensure atomic uploads of dependent assets (`video.mp4`, `thumbnail.jpg`, `metadata.json`, `timestamps.txt`).
- Documented future `UploadTask` model fields: `video_path`, `thumbnail_path`, `metadata_path`, `timestamps_path`.
- **M1/M3 Data Contract v2 Lock**:
  - **Thumbnail Rule**: Local `thumbnail.jpg` is the primary asset; AutoUploader will not download from `thumbnail_url`.
  - **Metadata.json Revision**: Added `title_final` constraint. Rendering engines now exclusively own the title generation strategy, ensuring AutoUploader unconditionally consumes the final title.
  - **M1 Fetch Revision**: Documented that URL fetching will retrieve Title, Description, Thumbnail, Channel Name, Duration, and Video ID for pre-processing previews.
- Updated `ARCHITECTURE.md`, `PROJECT_SNAPSHOT.md`, and `work_log.md` with these revisions.

### Stage 3.1: Backend Architecture Preparations
- **Settings Module**: Restructured to act strictly as global, application-wide configuration.
- **Profiles Segregation**: Profile-specific rules (Metadata Strategy, Approval Queue, Gemini API Mode, Watch Folder Path, Render Sources) were completely isolated into the new Profiles Module and Account configurations.
- **Watch Folder Engine**: Remains global in settings (Scan Interval, Detection Mode), but actual paths are scoped to individual Profiles/Accounts.

### Settings Revisions
- Pruned profile-specific rules.
- Added **Gemini Usage Monitor** alongside the Gemini API Key configuration.
- Converted **Settings Backup** into a comprehensive `Backup & Recovery` engine (Auto Backup, Interval, Location, Timestamp, Backup Now action).
- Implemented real config engines: AI Metadata, Watch Folder, Scheduler & Retry Engine, Storage & Cache.

### Profiles Revisions
- **Architecture Setup**: Abstracted metadata rules away from individual accounts into reusable Profiles.
- **Bulk Import**: Implemented advanced Bulk Import logic (Replace vs Append) for Title, Description, and Tag templates.
- **Live Preview System**: Implemented mock translation to visualize how variables (e.g. `{TITLE}`) expand using current template blocks.

### M1/M3 Workflow Decisions
- **M1 Workflow**: URL -> Download -> Cleanup -> Review -> Queue -> Upload.
- **M3 Workflow**: Watch Folder -> Folder Detection -> Read files -> Gemini Metadata -> Pending Review -> Queue -> Upload.
- Both workflows strictly enforce the revised Queue phases: PENDING_REVIEW, QUEUED, SCHEDULED, UPLOADING, SUCCESS, FAILED, CANCELLED (APPROVED state removed).
- Upload Tasks store a final metadata snapshot to remain an immutable history, and track `metadata_source` (including `MANUAL`) and `source_type`.

### Stage 3.4.4: UI Audit Fix Pack
- **History Module Critical Bug Fixed**: `useState` hooks declared after `useMemo` that referenced them — causing undefined variables and crash on History page open. Fixed by moving all useState declarations above useMemo.
- **Last Active Module Persistence**: Added Zustand `persist` middleware to `appStore.ts` — `activeModule` now survives browser refresh via localStorage (`au-app-store` key).
- **Delete Confirmation Modals**: Replaced `window.confirm()` on Account Delete and Profile Delete with a styled `ConfirmModal` component showing account/profile name.
- **Watch Folder Browse Button**: Replaced plain text input with `FolderInput` component (input + disabled Browse button with "Coming Later" tooltip) in both AccountsPanel and AccountCreateForm.
- **Profile Create/Edit Parity**: Added `Gemini API Mode` and `Approval Queue` fields to `ProfileDetailPanel` (Edit view) to match `ProfileCreateForm` (Create view).
- **Profile Preview Binding**: Fixed hardcoded "DJ Remix Factory" in Profile Preview → now shows `localProfile.name` dynamically.
- **Tag Format Guidance**: Added helper text in Tag Templates section: "Enter tags without # — system will add # automatically."
- **Bulk Import UX**: Helper text already present in BulkImportEditor (unchanged — already correct).
- **History Empty State**: Metrics now show true zeros (Total=0, Failed=0, Retry=0%) when no history items match filters.
- **Upload Queue Empty State**: Updated "No task selected" to explanatory text about Watch Folder Engine.
- **Scan Folder / Upload Video buttons**: Disabled with "Coming in Stage 3.5" / "Coming in Future Engine" labels.
- **Settings Gemini API Key**: Made input field editable (was static display div).
- **Workspace Dropdown**: Marked COMING LATER with disabled state.
- **ConfirmModal**: Created reusable `common/ConfirmModal.jsx` component for all delete confirmations.

### Stage 3.5.0: Watch Folder Engine Architecture Review
- **Scan Mode Locked**: Polling at 15s default interval (not OS file watcher — platform compatibility + reliability on network drives).
- **Validation Rules Locked**: video.mp4 = only required file. All others degrade gracefully. No task created if video.mp4 absent or 0 bytes.
- **Duplicate Strategy Locked**: Dual check — package_folder path in DB (primary) + video_id from metadata.json (secondary, warn-only). Sentinel file `.au_imported` written post-import.
- **Metadata Source Hierarchy Locked**: RENDERER (valid metadata.json) → PROFILE (missing) → MANUAL (invalid/malformed).
- **State Machine Locked**: IDLE → SCANNING → VALIDATING → IMPORTING. Error states: ERROR, PAUSED.
- **Background Engine**: asyncio task — starts on FastAPI startup if any Account has watch_folder_enabled = True.
- **Schema Addition**: One nullable `video_id` column on `UploadTask` — minor migration, no structural changes.
- **Gemini Policy**: Manual trigger only on Watch Folder imports. Auto-trigger on import is explicitly prohibited.
- **No DB/API changes made**: Architecture review only. Implementation is Stage 3.5.

### Stage 3.5.1: Watch Folder Engine Architecture Revision
Supersedes Stage 3.5.0. Six revisions applied:

- **R1 — metadata.json REQUIRED**: Promoted from RECOMMENDED to hard-required. Import fails if metadata.json is missing or malformed. Reason: pipeline depends on title_final, description, video_id, source_channel, source_url — no acceptable fallback.
- **R2 — Sentinel file REMOVED**: `.au_imported` pattern rejected. AutoUploader never writes files into renderer output folders. No side effects on backups, cloud sync, or folder portability. DB is sole source of truth.
- **R3 — Duplicate detection REBUILT**: Primary key is `video_id` (stable across folder moves/renames). Secondary is `package_folder` (anti-stale rescan guard). Conflict surfaces warning to user requiring explicit decision: Skip or Import Anyway. `duplicate_risk = true` stored on UploadTask for user-overridden conflicts.
- **R4 — ERROR state RETRIES**: Path inaccessible no longer auto-disables the engine. Engine enters ERROR, keeps retrying on every scan interval. Auto-recovers to SCANNING when path returns. Handles unplugged drives, network outages, and temporary permission issues.
- **R5 — Watch Folder Health Panel DESIGNED**: Account Detail will expose status, last scan timestamp, last import timestamp, total packages imported, import error count, and pending duplicate decisions. In-memory error log per account (ephemeral, not DB-persisted in Stage 3.5).
- **R6 — Gemini EXPLICITLY EXCLUDED**: Hard architectural boundary. Engine never imports, references, or calls any Gemini module. All Gemini activity remains manual-only in Detail Panel.
- **State machine updated**: IDLE → SCANNING → VALIDATING → DUPLICATE_CHECK → IMPORTING.
- **Schema additions**: `video_id` (nullable String) + `duplicate_risk` (nullable Boolean) on UploadTask — two additive columns, no structural changes.
- **No DB/API changes made**: Architecture revision only. Implementation is Stage 3.5.

### Stage 3.5.2: Watch Folder Implementation Plan
- Complete file-by-file backend tree produced (9 new files, 4 modified).
- DB migration: 2 columns planned (video_id, duplicate_risk). Migration via DB drop+recreate for dev.
- Engine component map: Scanner → Validator → DuplicateChecker → Importer → HealthTracker → ErrorTracker.
- Full validation pipeline documented (12 steps). Duplicate deferred-queue workflow designed.
- Health API: 3 endpoints planned. 5-phase rollout (3.5.3-A through 3.5.3-E) defined.

### Stage 3.5.2-R1: Watch Folder Implementation Plan — Final Revision
Supersedes Stage 3.5.2. Six revisions applied:

- **R1 — video_id REQUIRED**: Promoted from nullable/warning to VALIDATION_FAILED hard fail. video_id is the primary identifier for duplicate detection, history, analytics, and audit. Missing video_id = package rejected.
- **R2 — Duplicate handling SIMPLIFIED**: Deferred queue, resolution UI, approval workflow, and `POST /resolve` endpoint all removed. Stage 3.5 behavior: Detect → Log → Skip. No user interaction required for duplicates.
- **R3 — Threading LOCKED**: threading.Thread with daemon=True confirmed as engine strategy. asyncio alternatives removed from plan. Simpler lifecycle, native SQLAlchemy ORM compatibility.
- **R4 — Health persistence DESIGNED**: `imported_count` and `last_import_at` derived from DB queries — survive backend restart. `engine_state`, `last_scan_at`, and error log remain ephemeral (in-memory).
- **R5 — Manual Scan ADDED to Stage 3.5**: `POST /api/watch-folder/scan-now/{account_id}` endpoint + `[ Scan Now ]` button in WatchFolderHealthPanel and UploadHeader. Returns ScanResult with counts.
- **R6 — API surface SIMPLIFIED**: From 3 endpoints to 2 (GET health + POST scan-now). Error log merged into health response (`last_error_message`). Resolve endpoint removed.
- **DB column reduction**: `duplicate_risk` column removed (no longer needed without resolution workflow). Only `video_id` added.
- **No implementation yet**: All changes are planning documents only. Implementation pending approval.

### Stage 3.5.3-A: DB Migration [IMPLEMENTED]
- `models.py` — added `video_id = Column(String, nullable=True, index=True)` to UploadTask.
- `schemas.py` — added `video_id: Optional[str] = None` to UploadTaskBase, UploadTaskUpdate, UploadTaskResponse.
- `app_v2.db` dropped and recreated with fresh schema including video_id column and index.
- `GET /api/queue` verified to include video_id field in responses.

### Stage 3.5.3-B: Engine Core [IMPLEMENTED]
- `backend/services/__init__.py` — package marker.
- `backend/services/watch_folder/__init__.py` — package marker.
- `backend/services/watch_folder/scanner.py` — FolderScanner: os.scandir + 3-second mtime stability window. Returns (candidates, path_ok). path_ok=False signals ERROR state.
- `backend/services/watch_folder/validator.py` — PackageValidator: 11-step pipeline. 6 hard-fail error codes (MISSING_VIDEO, EMPTY_VIDEO, MISSING_METADATA, MALFORMED_METADATA, MISSING_TITLE_FINAL, MISSING_VIDEO_ID). Returns ValidationResult dataclass.
- `backend/services/watch_folder/duplicate_checker.py` — DuplicateChecker: video_id primary check, package_folder secondary guard. FAILED/CANCELLED allow re-import. Detect → Log → Skip. No deferred queue.
- `backend/services/watch_folder/importer.py` — PackageImporter: atomic UploadTask INSERT. status=PENDING_REVIEW, metadata_source=RENDERER. Rolls back on DB error.
- `backend/services/watch_folder/engine.py` — WatchFolderEngine: threading.Thread daemon, 15s interval, per-account scan, state machine (IDLE/SCANNING/ERROR/PAUSED). Module-level singleton via get_engine().
- `backend/main.py` — @app.on_event("startup") starts engine thread; @app.on_event("shutdown") stops it cleanly. Logging configured.
- `backend/test_watch_folder.py` — 8 test scenarios, 28/28 assertions passed. Uses in-memory SQLite.

### Stage 3.5.3-C: Health API + Manual Scan [IMPLEMENTED]
- `backend/services/watch_folder/health_service.py` — added in-memory state combined with DB queries to provide health statuses including `last_scan_status` and `last_scan_count`.
- `backend/api/watch_folder.py` — added endpoints `GET /api/watch-folder/health` and `POST /api/watch-folder/scan`.

### Stage 3.5.3-D: Frontend Integration [IMPLEMENTED]
- **Architectural Shift**: Decoupled presentation text from the backend engine state. Backend returns enums (`last_scan_status`), while frontend translates to human-readable strings (e.g. `NO_PACKAGES` → "No Packages Found").
- **Centralized Polling**: Replaced component-level setIntervals with global state intervals inside `accountsStore.ts` via `startHealthPolling` and `stopHealthPolling`.
- **Global Scan Refresh**: `POST /api/watch-folder/scan` endpoint updates all enabled accounts in the backend. Handled in frontend by universally refreshing health states post-scan.
- **Component Added**: `WatchFolderHealthPanel.jsx` added, displaying 8 critical Watch Folder metrics and empty-states, rendered underneath Automation section in `AccountsPanel`.
- **Zustand State**: Added `watchFolderHealth` Map and fetching logic inside `accountsStore.ts`.