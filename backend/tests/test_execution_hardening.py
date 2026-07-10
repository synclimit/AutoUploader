import pytest
from datetime import datetime
import uuid
import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import (
    Base, Account, Profile, CampaignAsset, CampaignReviewSession, 
    CampaignUploadPlan, CampaignExecutionState, UploadTask, CampaignUploadJournal, FailureCategory
)
from schemas import UploadTaskCreate, QueueStatusEnum
from services.campaign_execution_service import CampaignExecutionService, get_campaign_execution_engine
from services.events import get_event_bus

engine = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

@pytest.fixture
def db():
    db_session = TestingSessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

@pytest.fixture
def test_data(db):
    account = Account(id=str(uuid.uuid4()), channel_name="Test Channel")
    db.add(account)
    
    asset = CampaignAsset(
        id=str(uuid.uuid4()), channel_id=account.id, filename="/test/video.mp4", 
        status="APPROVED", fingerprint="xyz", sha256="test-sha256", filesize=1024, duration_seconds=10
    )
    db.add(asset)
    
    session = CampaignReviewSession(
        id=str(uuid.uuid4()), channel_id=account.id, status="APPROVED"
    )
    db.add(session)
    
    plan = CampaignUploadPlan(
        id=str(uuid.uuid4()), review_session_id=session.id, campaign_asset_id=asset.id,
        channel_id=account.id, pipeline_type="long", execution_status=CampaignExecutionState.PLANNED,
        title="Test Title", publish_datetime=datetime.utcnow(), humanized_datetime=datetime.utcnow(),
        publish_order=1, publish_date="2026-07-10", publish_time="10:00:00"
    )
    db.add(plan)
    db.commit()
    
    return {"account": account, "asset": asset, "session": session, "plan": plan}

def test_start_campaign_generates_correlation_id(db, test_data):
    session_id = test_data["session"].id
    channel_id = test_data["account"].id
    plan_id = test_data["plan"].id
    
    count = CampaignExecutionService.start_campaign(db, session_id, channel_id, "long")
    assert count == 1
    
    db.refresh(test_data["plan"])
    assert test_data["plan"].execution_status == CampaignExecutionState.READY
    assert test_data["plan"].correlation_id is not None
    assert test_data["plan"].correlation_id.startswith("CAMPAIGN-")
    assert test_data["plan"].execution_no > 0
    assert test_data["plan"].attempt == 1

def test_engine_processes_ready_plans(db, test_data):
    plan = test_data["plan"]
    plan.execution_status = CampaignExecutionState.READY
    plan.correlation_id = "CAMPAIGN-TEST-123"
    plan.execution_no = 999
    db.commit()
    
    events_received = []
    def on_task_created(payload):
        events_received.append(payload)
        
    get_event_bus().subscribe("campaign.task.created", on_task_created)
    
    engine = get_campaign_execution_engine()
    engine._process_ready_plans()
    
    db.refresh(plan)
    assert plan.execution_status == CampaignExecutionState.UPLOADING
    assert plan.upload_task_id is not None
    
    task = db.query(UploadTask).filter(UploadTask.id == plan.upload_task_id).first()
    assert task is not None
    assert task.source_id == plan.id
    assert task.execution_source == "CAMPAIGN"
    assert task.correlation_id == "CAMPAIGN-TEST-123"
    assert task.execution_no == 999
    
    # Event should have fired
    assert len(events_received) == 1
    assert events_received[0]["task_id"] == task.id
    assert events_received[0]["correlation_id"] == "CAMPAIGN-TEST-123"

def test_retry_plan_increments_attempt_keeps_correlation(db, test_data):
    plan = test_data["plan"]
    plan.execution_status = CampaignExecutionState.FAILED
    plan.correlation_id = "CAMPAIGN-TEST-999"
    plan.execution_no = 1
    plan.attempt = 1
    db.commit()
    
    retried_plan = CampaignExecutionService.retry_plan(db, plan.id)
    assert retried_plan.execution_status == CampaignExecutionState.READY
    assert retried_plan.attempt == 2
    assert retried_plan.correlation_id == "CAMPAIGN-TEST-999"  # Unchanged
    assert retried_plan.execution_no == 1 # Unchanged

def test_monitor_completed_finishes_campaign(db, test_data):
    plan = test_data["plan"]
    plan.execution_status = CampaignExecutionState.UPLOADING
    
    task = UploadTask(
        id=str(uuid.uuid4()), account_id=test_data["account"].id, 
        source_type="CAMPAIGN_EXECUTION", source_id=plan.id,
        package_folder="/test", video_path="/test.mp4", metadata_source="CAMPAIGN",
        status=QueueStatusEnum.completed.value, youtube_video_id="YOUTUBE-123"
    )
    db.add(task)
    db.commit()
    
    plan.upload_task_id = task.id
    db.commit()
    
    engine = get_campaign_execution_engine()
    engine._monitor_uploading_plans()
    
    db.refresh(plan)
    assert plan.execution_status == CampaignExecutionState.UPLOADED
    assert plan.youtube_video_id == "YOUTUBE-123"
    
    # Check journal
    journal = db.query(CampaignUploadJournal).filter(CampaignUploadJournal.campaign_upload_plan_id == plan.id).first()
    assert journal is not None
    assert journal.result == "UPLOADED"
    
    # Check Session lifecycle
    session = test_data["session"]
    db.refresh(session)
    assert session.status == "FINISHED"
