import csv
import io
from fastapi.responses import StreamingResponse
from .query_builder import build_journal_query
from sqlalchemy.orm import Session

def export_journal_csv(db: Session, params: dict) -> StreamingResponse:
    query = build_journal_query(db, params)
    
    # Do not paginate for export, fetch all matching
    items_query = query.all()
    
    def iter_csv():
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            "Correlation ID",
            "Execution No",
            "UploadTask ID",
            "CampaignUploadPlan ID",
            "Channel ID",
            "Pipeline Type",
            "Campaign ID",
            "Review Session ID",
            "Video Title",
            "Filename",
            "Attempt",
            "Started At",
            "Finished At",
            "Duration (s)",
            "Result",
            "Status",
            "Failure Category",
            "Failure Reason",
            "Error Message",
            "YouTube Video ID",
            "Publish Time",
            "Browser Profile"
        ])
        yield output.getvalue()
        output.seek(0)
        output.truncate(0)
        
        for journal, plan, asset in items_query:
            writer.writerow([
                journal.correlation_id or "",
                journal.execution_no or "",
                journal.upload_task_id or "",
                journal.campaign_upload_plan_id or "",
                plan.channel_id if plan else "",
                plan.pipeline_type if plan else "",
                asset.campaign_id if asset else "",
                plan.review_session_id if plan else "",
                plan.title if plan else "",
                asset.filename if asset else "",
                journal.attempt or "",
                journal.started_at.isoformat() if journal.started_at else "",
                journal.finished_at.isoformat() if journal.finished_at else "",
                journal.duration_seconds or "",
                journal.result or "",
                journal.status or "",
                journal.failure_category or "",
                journal.failure_reason or "",
                journal.error_message or "",
                journal.youtube_video_id or "",
                journal.publish_time.isoformat() if journal.publish_time else "",
                journal.browser_profile or ""
            ])
            yield output.getvalue()
            output.seek(0)
            output.truncate(0)
            
    # Formulate filename
    channel_name = params.get("channel_id", "all")
    date_range = params.get("date_from", "all-time")
    filename = f"upload_journal_{channel_name}_{date_range}.csv"
    
    headers = {
        "Content-Disposition": f"attachment; filename={filename}"
    }
    return StreamingResponse(iter_csv(), media_type="text/csv", headers=headers)
