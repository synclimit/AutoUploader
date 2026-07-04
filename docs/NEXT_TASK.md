# Backend Priority Roadmap

## Priority 1: Profiles Module Backend [COMPLETED]
- Create Profile
- Edit Profile
- Delete Profile
- Template Storage
- Bulk Import Storage

## Priority 2: Accounts Module Backend [COMPLETED]
- Create Account
- Edit Account
- Delete Account
- Profile Binding
- Watch Folder Storage

## Priority 3: Upload Queue Backend [COMPLETED — Stage 3.4]
- Pending Review
- Queued
- Scheduled
- Uploading
- Success
- Failed

## Priority 4: Watch Folder Engine [PLAN FINAL — Stage 3.5.2-R1]

### Architecture Reference
- Stage 3.5.1 Architecture Revision (FINAL)
- Stage 3.5.2-R1 Implementation Plan (FINAL — see implementation_plan.md)

### Locked Decisions
- threading.Thread (not asyncio)
- video_id = REQUIRED hard fail (not warning)
- Duplicate = Detect → Log → Skip (no queue, no UI, no resolution)
- Health metrics: imported_count + last_import_at from DB (persistent); engine_state + error_log ephemeral
- Scan Now included in Stage 3.5 (not deferred)
- 2 API endpoints: GET health + POST scan-now
- 1 new DB column: video_id (not 2 — duplicate_risk removed)

### ⚠️ Blocker Before Phase B
Confirm that M1/M3 renderer **always** produces `metadata.json` with `video_id` field.
Both are now hard-required. Folders missing either are permanently rejected.

---

### Phase A — Stage 3.5.3-A: DB Migration [COMPLETE]
- [x] `models.py` — add `video_id = Column(String, nullable=True, index=True)` to UploadTask
- [x] `schemas.py` — add `video_id: Optional[str] = None` to UploadTaskBase + UploadTaskResponse + UploadTaskUpdate
- [x] Drop + recreate `app_v2.db`
- [x] Verify `GET /api/queue` returns tasks with `video_id` field
- [x] Verify index created (`idx_upload_tasks_video_id`)

### Phase B — Stage 3.5.3-B: Engine Core [COMPLETE]
- [x] `backend/services/__init__.py`
- [x] `backend/services/watch_folder/__init__.py`
- [x] `backend/services/watch_folder/scanner.py` — FolderScanner (scan + 3s stability wait)
- [x] `backend/services/watch_folder/validator.py` — PackageValidator (11-step, 6 hard-fail codes)
- [x] `backend/services/watch_folder/duplicate_checker.py` — Detect -> Log -> Skip
- [x] `backend/services/watch_folder/importer.py` — atomic UploadTask creation
- [x] `backend/services/watch_folder/engine.py` — threading.Thread loop + state machine
- [x] `backend/main.py` — startup/shutdown hooks
- [x] `backend/test_watch_folder.py` — 28/28 assertions passed

### Phase C — Stage 3.5.3-C: Health API + Manual Scan [COMPLETE]
- [x] `backend/services/watch_folder/health_service.py` — in-memory + DB-derived fields
- [x] `backend/api/watch_folder.py`:
  - [x] `GET /api/watch-folder/health/{account_id}` — health snapshot
  - [x] `POST /api/watch-folder/scan` — immediate scan + ScanResult
- [x] `backend/main.py` — register watch_folder router
- [x] Verify `imported_count` persists across backend restart (from DB)
- [x] Verify `POST /scan` returns ScanResult with correct counts

### Phase D — Stage 3.5.3-D: Frontend Integration [COMPLETE]
- [x] `frontend/.../store/accounts/accountsStore.ts` — fetchHealth + scanNow
- [x] `frontend/.../accounts/accounts/WatchFolderHealthPanel.jsx` — 8 fields + Scan Now button
- [x] `AccountsPanel.jsx` — mount WatchFolderHealthPanel below Watch Folder row
- [x] Health panel polls every 30s globally from store
- [x] `UploadHeader.jsx` — activate "Scan Folder" button → scanNow (skipped per latest scope)
- [x] `uploadStore.ts` — add `video_id?: string` to UploadTask interface (skipped per latest scope)
- [x] Dashboard Watch Engine card → wire to `engine_state` from health API (skipped per latest scope)

### Phase E — Stage 3.5.3-E: Verification
- [ ] 19 unit tests — all pass
- [ ] 9 integration tests — all pass
- [ ] 10 manual QA scenarios — all pass
- [ ] Verify imported_count persists across restart
- [ ] Verify no writes to renderer output folders
- [ ] Verify no Gemini calls in engine path
- [ ] Update COMPLETION_REPORT.md
- [ ] Update CURRENT_STATUS.md — Stage 3.5 COMPLETE

## Priority 5: YouTube Upload Engine [PENDING]
- OAuth2 / YouTube API integration
- Video upload with metadata
- Thumbnail upload
- Schedule management

## Priority 6: Gemini Metadata Engine [PENDING]
- Gemini API integration
- Title / description / tag generation
- Template-variable injection