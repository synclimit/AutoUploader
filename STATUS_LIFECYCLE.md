# Upload Task Status Lifecycle

Every UploadTask inside AutoUploader follows a strict status progression. This ensures data integrity and predictable behavior across the Watch Folder Engine, Scheduler, AI Metadata Engine, and the Upload Worker.

## Standard Status Flow

The standard progression of an upload task is:

```
WATCHED -> REVIEW -> SCHEDULED -> QUEUED -> UPLOADING -> COMPLETED
```
*(Note: A task may also bypass SCHEDULED and go straight to QUEUED depending on configuration)*

### Detailed Flow
1. **WATCHED**: Initial status when a file is discovered by the Watch Folder Engine.
2. **REVIEW**: The file requires manual operator review (or AI generation).
3. **SCHEDULED**: The task has been approved but has a `scheduled_at` time in the future.
4. **QUEUED**: The task is ready to be uploaded by the Upload Worker immediately.
5. **UPLOADING**: The YouTube API worker is actively processing the upload.
6. **COMPLETED**: The upload finished successfully.

## Manual Override Flow (Approve & Upload)

An operator can manually override a scheduled task by clicking **Approve & Upload**. This forces the task to bypass the Scheduler Engine.

```
SCHEDULED -> [Operator clicks Approve & Upload] -> QUEUED -> UPLOADING
```

When this happens:
- The task's `scheduled_at` field is cleared (`None`).
- The task immediately enters `QUEUED` state.
- An event log is created indicating a manual override occurred.

## Exception States

- **FAILED**: If an error occurs during `UPLOADING` (or AI generation), the task enters this state.
- **CANCELLED**: The operator manually rejected the task.
