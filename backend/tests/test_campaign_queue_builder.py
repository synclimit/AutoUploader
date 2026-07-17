import pytest
import uuid
import json
from datetime import datetime

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.db import Base
from models import CampaignReviewSession, CampaignReviewAsset, CampaignAsset, CampaignUploadPlan, Channel, UploadTask, CampaignAssetState
from services.campaign_queue_builder import CampaignQueueBuilder

# Use an in-memory SQLite database for testing
engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    yield session
    session.close()
    Base.metadata.drop_all(bind=engine)

def test_build_queue_success(db_session):
    channel_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    
    # 1. Mock Channel configuration
    pipelines_config = {
        "long": {
            "daily_limit": 2,
            "schedule": ["09:00", "15:00"],
            "humanize": {"enabled": True, "min_delay_minutes": 5, "max_delay_minutes": 10}
        }
    }
    
    channel = Channel(
        id=channel_id,
        alias_name="Test Channel",
        publish_timezone="UTC",
        pipelines=json.dumps(pipelines_config)
    )
    db_session.add(channel)
    
    # 2. Mock CampaignAssets (Permanent storage)
    c_asset1 = CampaignAsset(
        id=str(uuid.uuid4()),
        channel_id=channel_id,
        fingerprint="fp1",
        sha256="sha1",
        filename="v1.mp4",
        filesize=100,
        duration_seconds=10,
        status=CampaignAssetState.NEW
    )
    c_asset2 = CampaignAsset(
        id=str(uuid.uuid4()),
        channel_id=channel_id,
        fingerprint="fp2",
        sha256="sha2",
        filename="v2.mp4",
        filesize=200,
        duration_seconds=20,
        status=CampaignAssetState.NEW
    )
    c_asset3 = CampaignAsset(
        id=str(uuid.uuid4()),
        channel_id=channel_id,
        fingerprint="fp3",
        sha256="sha3",
        filename="v3.mp4",
        filesize=300,
        duration_seconds=30,
        status=CampaignAssetState.NEW
    )
    db_session.add_all([c_asset1, c_asset2, c_asset3])
    
    # 3. Mock Review Session (LOCKED)
    review_session = CampaignReviewSession(
        id=session_id,
        channel_id=channel_id,
        pipeline_type="long",
        strategy="campaign",
        status="LOCKED"
    )
    db_session.add(review_session)
    
    # 4. Mock Review Assets (selected)
    db_session.add(CampaignReviewAsset(
        session_id=session_id, fingerprint="fp1", filepath="/tmp/v1.mp4",
        filename="v1.mp4", filesize=100, duration_seconds=10, selected=True, title="Title 1"
    ))
    db_session.add(CampaignReviewAsset(
        session_id=session_id, fingerprint="fp2", filepath="/tmp/v2.mp4",
        filename="v2.mp4", filesize=200, duration_seconds=20, selected=True, title="Title 2"
    ))
    db_session.add(CampaignReviewAsset(
        session_id=session_id, fingerprint="fp3", filepath="/tmp/v3.mp4",
        filename="v3.mp4", filesize=300, duration_seconds=30, selected=True, title="Title 3"
    ))
    
    db_session.commit()
    
    # 5. Build Queue
    plans = CampaignQueueBuilder.build_queue(db_session, session_id, channel_id, "long")
    
    assert len(plans) == 3
    assert plans[0].publish_time == "09:00"
    assert plans[1].publish_time == "15:00"
    assert plans[2].publish_time == "09:00" # Wraps to next day
    
    assert plans[0].publish_date == plans[1].publish_date
    assert plans[2].publish_date != plans[0].publish_date # Next day
    
    assert plans[0].title == "Title 1"
    
    # Check physical asset ID mapping
    assert plans[0].campaign_asset_id == c_asset1.id
    
    # Humanize assertions
    delta = plans[0].humanized_datetime - plans[0].publish_datetime
    assert 5 <= delta.total_seconds() / 60 <= 10

def test_queue_builder_rejects_unlocked(db_session):
    channel_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    
    review_session = CampaignReviewSession(
        id=session_id,
        channel_id=channel_id,
        pipeline_type="long",
        status="REVIEWING"
    )
    db_session.add(review_session)
    db_session.commit()
    
    with pytest.raises(ValueError, match="must be LOCKED"):
        CampaignQueueBuilder.build_queue(db_session, session_id, channel_id, "long")

def test_idempotency(db_session):
    channel_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    
    pipelines_config = {
        "long": {
            "daily_limit": 1,
            "schedule": ["09:00"],
            "humanize": {"enabled": False}
        }
    }
    db_session.add(Channel(id=channel_id, alias_name="Test", pipelines=json.dumps(pipelines_config)))
    
    c_asset = CampaignAsset(
        id=str(uuid.uuid4()), channel_id=channel_id, fingerprint="fp1",
        sha256="123", filename="", filesize=0, duration_seconds=0
    )
    db_session.add(c_asset)
    
    db_session.add(CampaignReviewSession(id=session_id, channel_id=channel_id, pipeline_type="long", status="LOCKED"))
    db_session.add(CampaignReviewAsset(session_id=session_id, fingerprint="fp1", filepath="", filename="", filesize=0, duration_seconds=0, selected=True))
    db_session.commit()
    
    # First build
    plans1 = CampaignQueueBuilder.build_queue(db_session, session_id, channel_id, "long")
    assert len(plans1) == 1
    
    # Second build (Idempotent)
    plans2 = CampaignQueueBuilder.build_queue(db_session, session_id, channel_id, "long")
    assert plans1[0].id == plans2[0].id
    
    # Rebuild
    plans3 = CampaignQueueBuilder.build_queue(db_session, session_id, channel_id, "long", rebuild=True)
    assert plans1[0].id != plans3[0].id

def test_no_upload_task_created(db_session):
    channel_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    
    pipelines_config = {"long": {"daily_limit": 1, "schedule": ["09:00"]}}
    db_session.add(Channel(id=channel_id, alias_name="Test", pipelines=json.dumps(pipelines_config)))
    c_asset = CampaignAsset(id=str(uuid.uuid4()), channel_id=channel_id, fingerprint="fp1", sha256="123", filename="", filesize=0, duration_seconds=0)
    db_session.add(c_asset)
    db_session.add(CampaignReviewSession(id=session_id, channel_id=channel_id, pipeline_type="long", status="LOCKED"))
    db_session.add(CampaignReviewAsset(session_id=session_id, fingerprint="fp1", filepath="", filename="", filesize=0, duration_seconds=0, selected=True))
    db_session.commit()
    
    CampaignQueueBuilder.build_queue(db_session, session_id, channel_id, "long")
    
    # Verify execution lock rules
    assert db_session.query(UploadTask).count() == 0
