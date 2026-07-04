# WORKFLOW_RUNTIME_REPORT

## Evidence of Transitions
1. SQLite: Task created by `import_api`.
2. Import: Validates and pushes to `UPLOAD_DIR`.
3. Review: Task metadata edited and `approve` called.
4. Queue: `UploadService.approve()` sets status to `QUEUED`.
5. Upload Engine: `upload_engine` picks up `QUEUED` tasks.
6. Completed: UI lists `SUCCESS` and `FAILED` tasks.
7. History: Fetches from SQLite using `useQueueStore`.
