# Architecture & Workflows

## Approved Workflows

### M1 Workflow

Folder-based output expectation. When a track is finalized, it expects the following folder structure:

```text
Output/
  Folder_Name/
    video.mp4      (Required)
    thumbnail.jpg  (Optional: Automatically becomes YouTube thumbnail)
    metadata.json  (Optional: Used for metadata prefill)
```

Workflow Steps:
```text
YouTube URL
↓
Download
↓
Metadata Cleanup
↓
Folder Generation
↓
Review
↓
Queue
↓
Upload
```

### M3 Workflow

Similar to M1 but includes timestamps for long-form mixes or playlists.

```text
Output/
  Folder_Name/
    video.mp4       (Required)
    thumbnail.jpg   (Optional)
    metadata.json   (Optional)
    timestamps.txt  (Required/Optional: Used for chapters and playlist timestamps)
```

Workflow Steps:
```text
Watch Folder (Scans for Folders, NOT individual MP4s)
↓
New Folder Detected (Validates video.mp4, thumbnail.jpg, metadata.json, timestamps.txt)
↓
Gemini Metadata Generation / Extraction
↓
Pending Review
↓
Queue
↓
Upload
```

## M1 / M3 Data Contract v2

To ensure decoupling between rendering modules (M1/M3) and AutoUploader, the following data contract is strictly enforced.

### 1. Folder-Based Upload Package Rule
- The output of any workflow is always a **Directory**, representing an atomic "Upload Package".
- **Required**: `video.mp4`, `metadata.json`
- **Optional**: `thumbnail.jpg`, `timestamps.txt`
- **Never optional again**: `metadata.json` was demoted to RECOMMENDED in Stage 3.5.0 — this is **reversed** in Stage 3.5.1. The full pipeline (title, description, video_id, source attribution) depends on it.

### 2. Thumbnail Rule
- Local `thumbnail.jpg` is the **primary** source of truth for the YouTube thumbnail.
- `thumbnail_url` within `metadata.json` is treated as strictly optional metadata. AutoUploader will not attempt to re-download the thumbnail if `thumbnail_url` is present. It will read the local `thumbnail.jpg` directly.

### 3. metadata.json Revision & title_final Rule
The `metadata.json` must provide a `title_final` field. The rendering engine fully owns the title strategy (e.g., Original, Original + Suffix, Custom). AutoUploader will unconditionally consume `title_final`.
```json
{
  "title": "",
  "cleaned_title": "",
  "title_final": "",
  "description": "",
  "source_channel": "",
  "source_url": "",
  "thumbnail_url": "",
  "video_id": ""
}
```

### 4. M1 Fetch Workflow Revision
When a user inputs a URL to fetch (e.g., `https://youtube.com/xxxxx`), the module retrieves the following core elements:
- Title
- Description
- Thumbnail
- Channel Name
- Duration
- Video ID

The future UI will display a preview containing the Thumbnail Preview, Channel, Title, Duration, Video ID, and Metadata Status before processing begins.

## Watch Folder Engine Rules

The Watch Folder Engine strictly monitors **directories**, not individual media files.
- **Reasoning**: Upload assets belong together. Scanning folders ensures all dependent assets are processed as a single atomic unit, avoiding thumbnail and metadata mismatches.

### Watch Folder Engine — Validation Rules (Stage 3.5.1 FINAL)

| File | Status | Behavior if Missing |
|---|---|---|
| `video.mp4` | **REQUIRED** | Hard fail — `VALIDATION_FAILED`, log error, skip folder |
| `metadata.json` | **REQUIRED** | Hard fail — `VALIDATION_FAILED`, log error, skip folder |
| `thumbnail.jpg` | OPTIONAL | Import proceeds — `thumbnail_path = null` |
| `timestamps.txt` | OPTIONAL (M3) | Import proceeds — `timestamps_path = null` |

**metadata.json is required** because the entire downstream pipeline depends on `title_final`, `description`, `video_id`, `source_channel`, and `source_url`. Without it, queue task quality collapses.

### Watch Folder Engine — Duplicate Detection (Stage 3.5.1 FINAL)

**Primary key**: `video_id` from `metadata.json`  
**Secondary signal**: `package_folder` path (anti-stale rescan guard)  
**No sentinel file**: AutoUploader never writes files into renderer output folders  
**DB is sole source of truth**

Duplicate workflow:
- `video_id` not found → safe to import
- `video_id` found, status = FAILED/CANCELLED → safe to re-import (retry)
- `video_id` found, status = SUCCESS/QUEUED/UPLOADING → surface warning to user, require decision (Skip or Import Anyway)
- Import Anyway → `duplicate_risk = true` flag stored on UploadTask

### Watch Folder Engine — State Machine (Stage 3.5.1 FINAL)

States: `IDLE` → `SCANNING` → `VALIDATING` → `DUPLICATE_CHECK` → `IMPORTING` → back to `IDLE`  
`PAUSED` (manual), `ERROR` (path inaccessible — **retries on interval, auto-recovers when path returns**)  

Key change from Stage 3.5.0: `ERROR` is no longer terminal. Engine keeps retrying until path is accessible again. No manual re-enable required.

### Watch Folder Engine — Performance (Stage 3.5.1 FINAL)

- **Mode**: Polling (not OS file watcher)
- **Default interval**: 15 seconds (configurable in Settings)
- **Stability wait**: 3 seconds no active file writes before validation
- **Scope**: Per-account, multi-account aware
- **Gemini**: Explicitly excluded — engine never triggers any Gemini call
- **Filesystem policy**: Engine never writes to, modifies, or deletes any file in a renderer output folder

## Future Data Models

### Upload Task Model
In preparation for these workflows, the future `UploadTask` model will support the following paths to encapsulate all assets within a single upload queue entity:
- `video_path`
- `thumbnail_path`
- `metadata_path`
- `timestamps_path`

### Upload Task Metadata Snapshot
- Tasks store an immutable snapshot of `title` and `description` (using `title_final` from `metadata.json`).
- Tracks origin via `metadata_source` (`PROFILE`, `GEMINI`, `RENDERER`, `MANUAL`).
- Inherits `source_type` (`M1_VIDEO_SPLITTER`, `M3_PLAYLIST_BUILDER`, `MANUAL_UPLOAD`) for history and analytics filtering.

### Planned Schema Additions (Stage 3.5 migration)
- `video_id` — nullable String on `UploadTask` — primary duplicate detection key
- `duplicate_risk` — nullable Boolean on `UploadTask` — set to true when user explicitly imports despite duplicate warning

### Manual Workflow

```text
Upload Video
↓
Metadata
↓
Queue
↓
Upload
```
