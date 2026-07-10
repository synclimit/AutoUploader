from sqlalchemy.orm import Session
import math
from .query_builder import build_journal_query

def get_paginated_journal(db: Session, params: dict):
    query = build_journal_query(db, params)
    
    # Pagination
    try:
        page = int(params.get("page", 1))
        if page < 1:
            page = 1
    except ValueError:
        page = 1
        
    try:
        page_size = int(params.get("page_size", 50))
        if page_size < 1:
            page_size = 50
    except ValueError:
        page_size = 50

    total = query.count()
    items_query = query.offset((page - 1) * page_size).limit(page_size).all()
    
    formatted_items = []
    for journal, plan, asset in items_query:
        formatted_items.append({
            "id": journal.id,
            "campaign_upload_plan_id": journal.campaign_upload_plan_id,
            "upload_task_id": journal.upload_task_id,
            "source_id": journal.source_id,
            "correlation_id": journal.correlation_id,
            "execution_no": journal.execution_no,
            "attempt": journal.attempt,
            "browser_profile": journal.browser_profile,
            "result": journal.result,
            "status": journal.status,
            "duration_seconds": journal.duration_seconds,
            "duration_ms": journal.duration_ms,
            "youtube_video_id": journal.youtube_video_id,
            "publish_time": journal.publish_time,
            "failure_category": journal.failure_category,
            "error_message": journal.error_message,
            "failure_reason": journal.failure_reason,
            "started_at": journal.started_at,
            "finished_at": journal.finished_at,
            "created_at": journal.created_at,
            # Plan and Asset specific fields
            "campaign_id": asset.campaign_id if asset else None,
            "review_session_id": plan.review_session_id if plan else None,
            "video_title": plan.title if plan else None,
            "filename": asset.filename if asset else None,
            "channel_id": plan.channel_id if plan else None,
            "pipeline_type": plan.pipeline_type if plan else None,
        })
        
    return {
        "items": formatted_items,
        "total": total,
        "page": page,
        "page_size": page_size
    }
