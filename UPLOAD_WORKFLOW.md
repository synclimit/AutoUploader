# Upload Workflow

The Upload Worker is a background daemon that monitors the database for tasks ready to be uploaded and dispatches them to YouTube.

## Polling Mechanism
The worker continuously polls the `UploadTask` table. It specifically looks for tasks where:
- `status` is `QueueStatusEnum.queued` (String value: `"QUEUED"`)

## Processing Phases
When a `QUEUED` task is found, the worker executes the following workflow:

1. **Lock Task**: The task status is updated to `PROCESSING` (or `UPLOADING`) to prevent other workers from picking it up.
2. **Metadata Construction**: The worker builds the YouTube API request body using the task's title, description, category, and privacy settings.
3. **Chunked Upload**: The video file is uploaded via `MediaFileUpload` using resumable chunking.
4. **Thumbnail Upload**: If a thumbnail path exists, it is uploaded and attached to the video ID.
5. **Finalization**: The task status is marked as `COMPLETED`.

## Error Handling
If an exception occurs at any point during the upload:
- The error is logged to the terminal.
- The task status is marked as `FAILED`.
- The failure reason is recorded so the operator can inspect and retry from the Review Module.

## Statistics and Completion
Upon entering `COMPLETED`, the task automatically appears in the **Complete Module** and is accounted for in Dashboard and Analytics statistics under "Completed Total" and "Completed Today".
