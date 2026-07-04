# Review Workflow

The Review module acts as the manual intervention gate for operators to approve, modify, or reject uploads before they enter the processing queue.

## Access
Tasks enter the Review module typically via:
- **Watch Folder / Import**: Files are ingested and set to `WATCHED` or `REVIEW` depending on configuration.
- **AI Processing**: Tasks waiting for manual approval after AI generation.

## Operator Actions
The operator has several actions available:

1. **Reject**: Marks the task as `CANCELLED`.
2. **Save Draft**: Updates the task metadata without advancing its status.
3. **Approve & Upload**: Evaluates the task for upload.

### Approve & Upload Logic
When clicking "Approve & Upload", the system processes it as follows:

1. **Standard**: If the task was `WATCHED` or `REVIEW`, its status becomes `QUEUED`.
2. **Manual Override**: If the task was already `SCHEDULED`, clicking Approve & Upload acts as a **Manual Override**. The `scheduled_at` timestamp is explicitly removed, and the task immediately enters `QUEUED` state, bypassing the scheduler entirely.
3. **Retry**: If the task was `FAILED`, the operator can re-approve it to enter `QUEUED`.

## Data Integrity
All review statuses exactly map to the `QueueStatusEnum` source of truth. The "All Status" counter must perfectly match the sum of all visible task statuses in the database.
