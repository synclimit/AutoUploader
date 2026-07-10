import pytest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime

from database.db import Base
from models import CampaignReviewSession, CampaignReviewAsset, CampaignAsset, UploadTask
from services.campaign_review_service import CampaignReviewService
from schemas import CampaignScanResponse, CampaignScanSummary, CampaignScanAsset, CampaignReviewAssetUpdate

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

def test_create_review_session(db_session):
    channel_id = str(uuid.uuid4())
    scan_response = CampaignScanResponse(
        summary=CampaignScanSummary(detected=2, available=1, invalid=1),
        assets=[
            CampaignScanAsset(
                filename="valid_video.mp4",
                filepath="/tmp/valid_video.mp4",
                filesize=1000,
                duration_seconds=10.0,
                fingerprint="fp1",
                duplicate=False,
                status="NEW",
                selectable=True
            ),
            CampaignScanAsset(
                filename="invalid_video.mp4",
                filepath="/tmp/invalid_video.mp4",
                filesize=1000,
                duration_seconds=10.0,
                fingerprint="fp2",
                duplicate=False,
                status="INVALID",
                selectable=False
            )
        ]
    )

    session = CampaignReviewService.create_or_update_session(db_session, channel_id, scan_response)
    
    assert session is not None
    assert session.status == "DRAFT"
    assert session.detected == 2
    assert session.available == 1
    assert session.invalid == 1
    assert session.selected == 0
    assert len(session.assets) == 2
    
    # Check that NEW asset is editable but INVALID is not
    valid_asset = next(a for a in session.assets if a.status == "NEW")
    assert valid_asset.editable == True
    invalid_asset = next(a for a in session.assets if a.status == "INVALID")
    assert invalid_asset.editable == False

def test_select_asset(db_session):
    channel_id = str(uuid.uuid4())
    scan_response = CampaignScanResponse(
        summary=CampaignScanSummary(),
        assets=[
            CampaignScanAsset(
                filename="valid_video.mp4",
                filepath="/tmp/valid_video.mp4",
                filesize=1000,
                duration_seconds=10.0,
                fingerprint="fp1",
                duplicate=False,
                status="NEW",
                selectable=True
            ),
            CampaignScanAsset(
                filename="dup_video.mp4",
                filepath="/tmp/dup_video.mp4",
                filesize=1000,
                duration_seconds=10.0,
                fingerprint="fp2",
                duplicate=True,
                status="CONSUMED",
                selectable=False
            )
        ]
    )

    session = CampaignReviewService.create_or_update_session(db_session, channel_id, scan_response)
    valid_asset = next(a for a in session.assets if a.status == "NEW")
    dup_asset = next(a for a in session.assets if a.status == "CONSUMED")

    # Select valid asset
    session = CampaignReviewService.select_asset(db_session, channel_id, valid_asset.id, True)
    assert session.selected == 1
    assert session.selected_file_size == 1000
    assert session.selected_duration == 10.0
    assert session.status == "REVIEWING"

    # Cannot select CONSUMED asset
    with pytest.raises(ValueError):
        CampaignReviewService.select_asset(db_session, channel_id, dup_asset.id, True)

def test_update_metadata_and_persistence(db_session):
    channel_id = str(uuid.uuid4())
    scan_response = CampaignScanResponse(
        summary=CampaignScanSummary(),
        assets=[
            CampaignScanAsset(
                filename="valid_video.mp4",
                filepath="/tmp/valid_video.mp4",
                filesize=1000,
                duration_seconds=10.0,
                fingerprint="fp1",
                duplicate=False,
                status="NEW",
                selectable=True
            )
        ]
    )

    session = CampaignReviewService.create_or_update_session(db_session, channel_id, scan_response)
    asset = session.assets[0]

    updates = CampaignReviewAssetUpdate(
        title="My Custom Title",
        description="Cool description",
        tags="game, fun"
    )

    session = CampaignReviewService.update_asset_metadata(db_session, channel_id, asset.id, updates)
    
    # Reload session from DB to verify persistence
    reloaded_session = CampaignReviewService.get_session(db_session, channel_id)
    reloaded_asset = reloaded_session.assets[0]
    
    assert reloaded_asset.title == "My Custom Title"
    assert reloaded_asset.description == "Cool description"
    assert reloaded_asset.tags == "game, fun"

def test_approve_session_locks_it(db_session):
    channel_id = str(uuid.uuid4())
    scan_response = CampaignScanResponse(
        summary=CampaignScanSummary(),
        assets=[
            CampaignScanAsset(
                filename="valid_video.mp4",
                filepath="/tmp/valid_video.mp4",
                filesize=1000,
                duration_seconds=10.0,
                fingerprint="fp1",
                duplicate=False,
                status="NEW",
                selectable=True
            )
        ]
    )

    session = CampaignReviewService.create_or_update_session(db_session, channel_id, scan_response)
    asset = session.assets[0]

    # Select and edit
    CampaignReviewService.select_asset(db_session, channel_id, asset.id, True)
    CampaignReviewService.update_asset_metadata(db_session, channel_id, asset.id, CampaignReviewAssetUpdate(title="Locked Title"))

    # Approve
    session = CampaignReviewService.approve_session(db_session, channel_id)
    assert session.status == "LOCKED"

    # Further edits should fail
    with pytest.raises(ValueError):
        CampaignReviewService.update_asset_metadata(db_session, channel_id, asset.id, CampaignReviewAssetUpdate(title="New Title"))
        
    with pytest.raises(ValueError):
        CampaignReviewService.select_asset(db_session, channel_id, asset.id, False)

def test_database_isolation(db_session):
    # Verify no CampaignAsset or UploadTask records are created during Review process
    channel_id = str(uuid.uuid4())
    scan_response = CampaignScanResponse(
        summary=CampaignScanSummary(),
        assets=[
            CampaignScanAsset(
                filename="valid_video.mp4",
                filepath="/tmp/valid_video.mp4",
                filesize=1000,
                duration_seconds=10.0,
                fingerprint="fp1",
                duplicate=False,
                status="NEW",
                selectable=True
            )
        ]
    )

    CampaignReviewService.create_or_update_session(db_session, channel_id, scan_response)
    
    assert db_session.query(CampaignAsset).count() == 0
    assert db_session.query(UploadTask).count() == 0
