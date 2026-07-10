# Campaign Review Engine (Sprint 3.0)

## Overview
The Campaign Review Engine transforms passive Campaign Scan results into an interactive staging workspace where operators can validate, select, edit, and approve video assets before they are committed as `UploadTask` items.

It sits exactly between the **Campaign Scan Engine** and the **Upload Engine**. No actual upload to YouTube occurs within the Review Engine.

## Core Concepts

### 1. Persistent Sessions
The Review Session (`CampaignReviewSession`) is persisted in the SQLite database to survive app restarts. It allows the operator to edit metadata and resume their review process later.

### 2. Immutability of CampaignAsset
`CampaignAsset` is the physical fingerprint of a media file and remains immutable. All campaign-specific metadata (Title, Tags, Description) is stored temporarily in `CampaignReviewAsset` (a child of the Review Session).

### 3. Pipeline Separation
Campaign is an automation strategy configured per-pipeline (e.g., `long` or `shorts`). A Review Session is unique to a channel AND pipeline combination. 
- A scan creates or updates a Review Session specific to the channel and pipeline type.

### 4. Lifecycle
A Review Session goes through the following states:
1. `DRAFT`: Initial state created from a folder scan.
2. `REVIEWING`: Operator is actively selecting files and modifying metadata.
3. `APPROVED`: The session is marked ready for the Upload Engine.
4. `LOCKED`: The session has been consumed by the Upload Engine and can no longer be modified.

## Engine Workflow

1. **Trigger Scan**: Frontend calls `POST /api/v1/campaign-scan` with the selected folder.
2. **Review Initialized**: Frontend passes the scan response to `POST /api/v1/campaign-review`. The backend creates a `CampaignReviewSession` and populates `CampaignReviewAsset` entries based on the scan data.
3. **Data Sync**: If a session already exists for the channel/pipeline, the Engine updates asset statuses (e.g., matching fingerprints) and deletes missing ones, while preserving existing metadata.
4. **Metadata Editing**: Operator edits fields like Title and Tags. Frontend updates the DB via `POST /api/v1/campaign-review/update/{asset_id}`.
5. **Selection**: Operator marks which videos to upload using `POST /api/v1/campaign-review/select`.
6. **Approval**: Operator clicks "Approve". Frontend calls `POST /api/v1/campaign-review/approve`. Status is changed to `LOCKED`.

## API Endpoints

- `POST /api/v1/campaign-review?channel_id={id}&pipeline_type={type}`
  Takes a `CampaignScanResponse` in the body. Returns the `CampaignReviewSession`.
  
- `GET /api/v1/campaign-review/{channel_id}/{pipeline_type}`
  Retrieves the active Review Session to survive frontend reloads.
  
- `POST /api/v1/campaign-review/select`
  Selects or deselects an asset for upload. Validates against duplicates and invalid files.
  
- `POST /api/v1/campaign-review/update/{asset_id}?channel_id={id}&pipeline_type={type}`
  Updates temporary metadata for an asset.
  
- `POST /api/v1/campaign-review/approve`
  Locks the session. Only selected assets will proceed to the next stage (Sprint 4).
