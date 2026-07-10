from sqlalchemy import or_, desc, asc
from models import CampaignUploadJournal, CampaignUploadPlan, CampaignAsset
from sqlalchemy.orm import Query

def build_journal_query(db, params: dict) -> Query:
    query = db.query(CampaignUploadJournal, CampaignUploadPlan, CampaignAsset).outerjoin(
        CampaignUploadPlan, CampaignUploadJournal.campaign_upload_plan_id == CampaignUploadPlan.id
    ).outerjoin(
        CampaignAsset, CampaignUploadPlan.campaign_asset_id == CampaignAsset.id
    )

    # Basic exact matches
    if params.get("channel_id"):
        query = query.filter(CampaignUploadPlan.channel_id == params["channel_id"])
    if params.get("pipeline_type"):
        query = query.filter(CampaignUploadPlan.pipeline_type == params["pipeline_type"])
    if params.get("campaign_id"):
        query = query.filter(CampaignAsset.campaign_id == params["campaign_id"])
    if params.get("review_session_id"):
        query = query.filter(CampaignUploadPlan.review_session_id == params["review_session_id"])
    if params.get("execution_status"):
        query = query.filter(CampaignUploadJournal.status == params["execution_status"])
    if params.get("result"):
        query = query.filter(CampaignUploadJournal.result == params["result"])
    if params.get("correlation_id"):
        query = query.filter(CampaignUploadJournal.correlation_id == params["correlation_id"])
    if params.get("execution_no"):
        try:
            exec_no = int(params["execution_no"])
            query = query.filter(CampaignUploadJournal.execution_no == exec_no)
        except ValueError:
            pass

    # Date range filters
    if params.get("date_from"):
        query = query.filter(CampaignUploadJournal.started_at >= params["date_from"])
    if params.get("date_to"):
        query = query.filter(CampaignUploadJournal.started_at <= params["date_to"])

    # Search (Exact + LIKE)
    search_val = params.get("search")
    if search_val:
        search_str = str(search_val).strip()
        like_search = f"%{search_str}%"
        
        conditions = [
            CampaignUploadPlan.title.ilike(like_search),
            CampaignAsset.filename.ilike(like_search),
            CampaignUploadJournal.failure_reason.ilike(like_search),
            CampaignUploadJournal.error_message.ilike(like_search),
            CampaignUploadJournal.correlation_id == search_str,
            CampaignUploadJournal.upload_task_id == search_str,
            CampaignUploadPlan.review_session_id == search_str,
            CampaignAsset.campaign_id == search_str
        ]
        
        # Try to parse as integer for execution_no
        try:
            exec_no_search = int(search_str)
            conditions.append(CampaignUploadJournal.execution_no == exec_no_search)
        except ValueError:
            pass
            
        query = query.filter(or_(*conditions))

    # Sorting
    sort_param = params.get("sort", "created_at_desc")
    if sort_param == "created_at_asc":
        query = query.order_by(asc(CampaignUploadJournal.created_at))
    elif sort_param == "started_at_desc":
        query = query.order_by(desc(CampaignUploadJournal.started_at))
    elif sort_param == "started_at_asc":
        query = query.order_by(asc(CampaignUploadJournal.started_at))
    else:
        # default
        query = query.order_by(desc(CampaignUploadJournal.created_at))
        
    return query
