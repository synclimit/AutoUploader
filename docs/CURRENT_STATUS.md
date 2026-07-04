# Current Project Status

## Overall Status
- **Phase**: Stage 3.5.2-R1 — Watch Folder Engine Final Implementation Plan (LOCKED)
- **Architecture**: Approved and Revised (3.5.1 + 3.5.2-R1)
- **UI Prototype**: Complete
- **Backend**: Queue Backend Complete (Stage 3.4)

## Stage History

| Stage | Description | Status |
|---|---|---|
| Stage 3.2 | Profiles Backend | ✅ COMPLETE |
| Stage 3.3.2 | Accounts Backend | ✅ COMPLETE |
| Stage 3.4 | Queue Backend | ✅ COMPLETE |
| Stage 3.4.4 | UI Audit Fix Pack | ✅ COMPLETE |
| Stage 3.5.0 | Watch Folder Architecture Draft | ✅ SUPERSEDED by 3.5.1 |
| Stage 3.5.1 | Watch Folder Architecture Revision | ✅ ARCHITECTURE FINAL |
| Stage 3.5.2 | Watch Folder Implementation Plan | ✅ SUPERSEDED by 3.5.2-R1 |
| Stage 3.5.2-R1 | Watch Folder Implementation Plan Final | ✅ PLAN LOCKED |
| Stage 3.5.3-A | DB Migration (video_id column) | ✅ IMPLEMENTED |
| Stage 3.5.3-B | Engine Core (Scanner, Validator, Checker, Importer, Engine) | ✅ IMPLEMENTED |
| Stage 3.5.3-C | Health API + Manual Scan | ✅ IMPLEMENTED |
| Stage 3.5.3-D | Frontend Integration | ✅ IMPLEMENTED |
| Stage 3.5.3-E | Verification & Completion | ⏳ PENDING |

## Module Status

### Upload Module
- UI Prototype Complete
- Queue Backend: **Implemented (Stage 3.4)**
- Watch Folder Engine: **Core Implemented (Stage 3.5.3-A+B)**
  - `video_id` column on UploadTask ✅
  - `services/watch_folder/` package: scanner, validator, duplicate_checker, importer, engine ✅
  - Engine thread starts on FastAPI startup, stops on shutdown ✅
  - 28/28 verification assertions passed ✅
- Watch Folder Health API: **Implemented (Stage 3.5.3-C)**
- Watch Folder Frontend: **Implemented (Stage 3.5.3-D)**

### Accounts Module
- UI Prototype Complete
- Backend: **Implemented (Stage 3.3.2)**
- UI Audit Fixes: **Applied (Stage 3.4.4)**

### Profiles Module
- UI Prototype Complete
- Backend: **Implemented (Stage 3.2)**
- UI Audit Fixes: **Applied (Stage 3.4.4)**

### Settings Module
- UI Prototype Complete
- Backend Pending

### Dashboard
- UI Prototype Complete
- Backend Pending

### History
- UI Prototype Complete
- Backend Pending
- Critical Bug Fixed: hooks ordering (Stage 3.4.4)

## Watch Folder Engine — Final Locked Decisions (Stage 3.5.2-R1)

| Decision | Value |
|---|---|
| Scan mode | Polling, 15s hardcoded (Stage 3.5) |
| Required files | `video.mp4` + `metadata.json` + `title_final` + `video_id` (ALL hard-required) |
| Optional files | `thumbnail.jpg`, `timestamps.txt` |
| Duplicate handling | Detect → Log → Skip. No queue. No user decision. No UI. |
| Sentinel file | NONE — DB is sole source of truth |
| DB column additions | `video_id` only (nullable String + index) — `duplicate_risk` removed |
| Duplicate primary key | `video_id` from metadata.json |
| Duplicate secondary | `package_folder` (anti-stale rescan guard) |
| ERROR state | Retries on every interval. Auto-recovers when path returns. |
| State machine | `IDLE → SCANNING → VALIDATING → IMPORTING` (+ `PAUSED`, `ERROR`) |
| Background engine | `threading.Thread` with daemon=True — NOT asyncio |
| Health persistence | `imported_count` + `last_import_at` from DB (survive restart). `engine_state` + `error_log` ephemeral. |
| Manual scan | `POST /api/watch-folder/scan-now/{account_id}` — Scan Now button in UI |
| API surface | 2 endpoints: GET health + POST scan-now |
| Gemini | Explicitly excluded — engine never calls Gemini under any condition |
| Filesystem policy | Engine never writes to renderer output folders |

## Blocker Before Implementation

> **Q1 (Critical)**: Are `metadata.json` AND `video_id` **guaranteed present** in every M1/M3 render output?  
> Both are now HARD REQUIRED. Folders missing either will be permanently rejected on every scan cycle.  
> **Must be confirmed before Phase B (Engine Core) begins.**