# Campaign Scan Engine V1 (Sprint 2.0)

## Architecture Overview

The **Campaign Scan Engine** acts as the bridge between raw user files (Campaign Folder) and the `CampaignAsset` database. It converts thousands of raw videos into operator-ready asset lists, identifying duplicates and rejecting corrupt files instantly using immutable O(1) duplicate lookup and chunked streaming.

### Core Components
1. **CampaignAssetService** (Foundation Layer)
    - Responsible for calculating raw immutable fingerprints (`sha256 + filesize + duration_seconds`).
    - Provides O(1) query capabilities to load existing fingerprints into memory.
2. **CampaignScanService** (Scanner Engine)
    - Reads the `campaign_folder` recursively.
    - Consumes memory-efficient metadata parsers to validate video integrity.
    - Caches all existing database fingerprints in a `set` at the start of every scan for instantaneous O(1) lookup.
    - Emits a read-only payload to the frontend.

### Component Relationship
```mermaid
graph TD
    UI[Frontend Dashboard] --> |Browse Folder / Select Campaign| API[POST /api/v1/campaign-scan]
    API --> Scan[CampaignScanService]
    Scan --> |1. Pre-load DB Fingerprints O(1)| DB[(SQLite: CampaignAsset)]
    Scan --> |2. Recursive Walk| FS[Local Filesystem]
    FS -.-> |Calculate SHA256| AssetSvc[CampaignAssetService]
    AssetSvc -.-> |Extract Metadata| Scan
    Scan --> |Assign Status| Status{Status Engine}
    Status --> |Valid| New[NEW]
    Status --> |Already in DB| Dup[CONSUMED]
    Status --> |Missing Duration| Inv[INVALID]
    Status --> UI
```

---

## Architectural Rules (Commercial Execution Lock)

1. **Read-Only Scanner**: The Campaign Scan Engine NEVER writes to the database. It is an observer. Assets only become persistent when an upload occurs.
2. **Deterministic Lookup**: The O(1) check relies exclusively on the exact content fingerprint. Filename and file path are ignored. Moving a file or renaming it does not fool the duplicate detector.
3. **No Standalone Campaign Pipeline**: Campaign is an **Automation Strategy**. It lives within existing channels (`long`, `shorts`) exactly like the `Continuous` strategy.
4. **Resilience**: The scanner must not crash on individual files. Corrupted files (e.g., failed to parse `duration_seconds`) must be flagged as `INVALID` and the scan must continue.

---

## Status Matrix

| Status | Explanation | Selectable? | Action Required |
|--------|-------------|-------------|-----------------|
| `NEW` | File is clean, valid, and has not been uploaded before. | **YES** | Ready for upload execution. |
| `CONSUMED` | File fingerprint exists in `CampaignAsset` table. Duplicate detected. | **NO** | None. Handled automatically. |
| `INVALID` | File is corrupt, missing metadata, or not a video. | **NO** | Replace or fix the source file. |

---

## Manual QA Guide (For Operators)

Follow these steps to manually verify the integrity of the Campaign Scan Engine integration.

### Test 1: UI Toggle & Persistence
1. Navigate to Channel Configuration -> General Tab.
2. Observe the "Automation Strategy" toggle.
3. Switch between **Continuous Engine** and **Campaign Engine**.
4. Confirm that switching to Continuous exposes the `Watch Folder` and `Processing Order`.
5. Confirm that switching to Campaign exposes the `Campaign Folder` and `Total Target Videos`.
6. Save the pipeline, reload the page, and ensure the Automation Strategy state persists.

### Test 2: Auto-Scanning & Duplicate Detection
1. Open the **Campaign Engine** strategy.
2. Click `Browse` on the Campaign Folder and select a directory containing at least one known video.
3. Observe that the scan triggers **automatically** (no manual "Scan" button).
4. Verify the **Campaign Summary** populates correctly on the right panel.
5. In the **Campaign Asset Preview** table, verify the file shows as `NEW` (Green badge) and its checkbox is ticked (selectable).
6. Manually insert the fingerprint of that exact video into the `CampaignAsset` database (or wait until upload execution is built to consume it).
7. Change the folder and switch back to trigger a re-scan.
8. Verify that the file now appears as `CONSUMED` (Grey badge) and the checkbox is disabled.

### Test 3: Resilience to Corruption
1. Create a dummy text file and rename it to `fake_video.mp4`.
2. Place this file inside your chosen Campaign Folder.
3. Trigger a scan by selecting the folder.
4. Verify that the scan completes successfully (no backend crash or 500 error).
5. Verify that `fake_video.mp4` appears in the asset list as `INVALID` (Red badge) and cannot be selected.
