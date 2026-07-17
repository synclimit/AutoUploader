import pytest
import uuid
import json
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.db import Base
from models import (
    CampaignReviewSession, CampaignAsset, CampaignUploadPlan, 
    CampaignExecutionState, Channel, UploadTask
)
from services.campaign_execution_service import CampaignExecutionService, CampaignExecutionEngine
from schemas import QueueStatusEnum

# Use an in-memory SQLite database for testing
engine = create_engine("sqlite:///:memory:")
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_start_campaign(db_session):
    channel_id = "test_channel"
    session_id = "test_session"
    pipeline_type = "long"
    
    # Create required entities
    db_session.add(Channel(id=channel_id, alias_name="Test Channel"))
    
    # Create CampaignAsset
    c_asset = CampaignAsset(
        id=str(uuid.uuid4()), channel_id=channel_id, fingerprint="fp1",
        sha256="123", filename="test.mp4", filesize=100, duration_seconds=10
    )
    db_session.add(c_asset)
    
    # Create Upload Plan (PLANNED)
    plan = CampaignUploadPlan(
        id=str(uuid.uuid4()), review_session_id=session_id, campaign_asset_id=c_asset.id,
        channel_id=channel_id, pipeline_type=pipeline_type,
        publish_order=0, publish_date="2026-07-11", publish_time="09:00",
        publish_datetime=datetime.utcnow(), humanized_datetime=datetime.utcnow(),
        title="Test Title", execution_status=CampaignExecutionState.PLANNED
    )
    db_session.add(plan)
    db_session.commit()
    
    # Start Execution
    started_count = CampaignExecutionService.start_campaign(db_session, session_id, channel_id, pipeline_type)
    assert started_count == 1
    
    db_session.refresh(plan)
    assert plan.execution_status == CampaignExecutionState.READY

def test_execution_loop_creates_upload_task(db_session):
    channel_id = "test_channel"
    session_id = "test_session"
    pipeline_type = "long"
    
    db_session.add(Channel(id=channel_id, alias_name="Test Channel"))
    
    c_asset = CampaignAsset(
        id=str(uuid.uuid4()), channel_id=channel_id, fingerprint="fp1",
        sha256="123", filename="test.mp4", filesize=100, duration_seconds=10
    )
    db_session.add(c_asset)
    
    plan = CampaignUploadPlan(
        id=str(uuid.uuid4()), review_session_id=session_id, campaign_asset_id=c_asset.id,
        channel_id=channel_id, pipeline_type=pipeline_type,
        publish_order=0, publish_date="2026-07-11", publish_time="09:00",
        publish_datetime=datetime.utcnow(), 
        humanized_datetime=datetime.utcnow() - timedelta(minutes=1), # In the past
        title="Test Title", execution_status=CampaignExecutionState.READY
    )
    db_session.add(plan)
    db_session.commit()
    
    engine = CampaignExecutionEngine()
    
    # Mocking db to TestingSessionLocal for tests would require injecting db. 
    # Since Engine creates its own session, we mock it.
    import services.campaign_execution_service as ces
    original_session_local = ces.SessionLocal
    
    # We must use a separate session for the engine to avoid cross-session commit issues in tests
    def mock_session():
        return TestingSessionLocal()
        
    ces.SessionLocal = mock_session
    
    try:
        engine._process_ready_plans()
        
        # Verify UploadTask was created
        plan_id = plan.id
        db_session.expire_all()
        updated_plan = db_session.query(CampaignUploadPlan).filter(CampaignUploadPlan.id == plan_id).first()
        assert updated_plan.execution_status == CampaignExecutionState.UPLOADING
        assert updated_plan.upload_task_id is not None
        
        task = db_session.query(UploadTask).filter(UploadTask.id == updated_plan.upload_task_id).first()
        assert task is not None
        assert task.source_type == "CAMPAIGN_EXECUTION"
        assert task.title == "Test Title"
        assert task.status == QueueStatusEnum.queued.value
    finally:
        ces.SessionLocal = original_session_local

def test_retry_policy(db_session):
    channel_id = "test_channel"
    
    plan = CampaignUploadPlan(
        id=str(uuid.uuid4()), review_session_id="s1", campaign_asset_id="a1",
        channel_id=channel_id, pipeline_type="long",
        publish_order=0, publish_date="2026-07-11", publish_time="09:00",
        publish_datetime=datetime.utcnow(), humanized_datetime=datetime.utcnow(),
        execution_status=CampaignExecutionState.FAILED,
        retry_count=0, last_error="Network error",
        upload_task_id="old_task"
    )
    db_session.add(plan)
    db_session.commit()
    
    retried_plan = CampaignExecutionService.retry_plan(db_session, plan.id)
    
    assert retried_plan.execution_status == CampaignExecutionState.READY
    assert retried_plan.retry_count == 1
    assert retried_plan.last_error is None
    assert retried_plan.upload_task_id is None
