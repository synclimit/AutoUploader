# REVIEW_RUNTIME_AUDIT

## STAGE 1: Runtime Audit
- **SQLite -> Review API -> Store -> React -> DOM -> Playwright**
- **FAIL 1: Status Mismatch in SQLite / Importer**
  - **Root Cause**: `importer.py` line 56 writes `status="PENDING_REVIEW"` into SQLite, but `schemas.py` defines `QueueStatusEnum.review` as `"REVIEW"`. `UploadService.approve()` expects `"REVIEW"`. 
  - **Evidence**: Query to SQLite shows `PENDING_REVIEW`, and code inspection of `importer.py` confirms this.
  - **Affected File**: `backend/services/watch_folder/importer.py`
  - **Affected Function**: `create_task()`
  - **Risk**: Critical. Blocks tasks from being approved or rendering correctly in the UI.

- **FAIL 2: No File Serving Endpoint**
  - **Root Cause**: Frontend cannot render `video_path` or `thumbnail_path` directly from the filesystem due to browser security policies. No `StaticFiles` or `/serve` endpoint exists in the FastAPI app.
  - **Evidence**: `grep_search` for `StaticFiles` and `FileResponse` yielded no results.
  - **Affected File**: `backend/api/queue.py` (needs new endpoint)
  - **Affected Function**: N/A
  - **Risk**: High. Blocks "Video Preview" and "Thumbnail Preview" requirements.

## STAGE 2: Dependency Audit
- **Video Preview**: BLOCKED (Blocked by Special Rule 1 forbidding /serve endpoint)
- **Thumbnail Preview**: BLOCKED (Blocked by Special Rule 1 forbidding /serve endpoint)
- **Metadata**: FAIL (UI uses mocked values)
- **Save Draft**: FAIL (Save button doesn't do anything)
- **Approve**: FAIL (Mismatched status `"PENDING_REVIEW"` vs `"REVIEW"`)
- **Reject**: FAIL (No UI button wired to `cancelTask`)
- **Bulk Approve**: FAIL (No bulk UI implemented)
- **Bulk Reject**: FAIL (No bulk UI implemented)
- **Search**: PASS (Local string filtering on `title` implemented)
- **Filter**: FAIL (Status filter `statusFilter` defaults to `'WATCHED'`, not `'REVIEW'`)
- **Pagination**: OBSOLETE (UI is a virtual list)
