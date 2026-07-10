import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database.db import Base, get_db
from models import CampaignAsset, CampaignAssetState
from services.campaign_asset_service import CampaignAssetService
from main import app

# Setup test DB
engine = create_engine("sqlite:///test_scan.db", connect_args={"check_same_thread": False})
Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db_and_files():
    db = TestingSessionLocal()
    db.query(CampaignAsset).delete()
    db.commit()
    
    # Create a temporary directory structure for tests
    temp_dir = tempfile.mkdtemp()
    
    # Create 3 videos: 1 duplicate, 1 new, 1 corrupt
    # File 1: duplicate.mp4
    f1_path = os.path.join(temp_dir, "duplicate.mp4")
    with open(f1_path, "wb") as f:
        f.write(b"duplicate data")
        
    # File 2: new_video.mp4
    f2_path = os.path.join(temp_dir, "new_video.mp4")
    with open(f2_path, "wb") as f:
        f.write(b"new video data")
        
    # File 3: corrupt.mp4
    f3_path = os.path.join(temp_dir, "corrupt.mp4")
    with open(f3_path, "wb") as f:
        f.write(b"corrupt") # Faked below to return duration 0.0

    # Insert duplicate fingerprint into DB
    dup_sha256 = CampaignAssetService.calculate_sha256(f1_path)
    dup_fp = CampaignAssetService.build_fingerprint(
        sha256=dup_sha256,
        filesize=os.path.getsize(f1_path),
        duration_seconds=10.0 # Assuming it parses to 10.0
    )
    
    asset = CampaignAsset(
        fingerprint=dup_fp,
        sha256=dup_sha256,
        filename="duplicate.mp4",
        filesize=os.path.getsize(f1_path),
        duration_seconds=10.0,
        status=CampaignAssetState.CONSUMED
    )
    db.add(asset)
    db.commit()
    db.close()
    
    yield temp_dir
    
    # Cleanup
    import shutil
    shutil.rmtree(temp_dir)

def test_campaign_scan_workflow(setup_db_and_files, monkeypatch):
    temp_dir = setup_db_and_files
    
    # Mock read_video_metadata so it returns stable data for the tests
    original_read = CampaignAssetService.read_video_metadata
    
    def mocked_read(filepath):
        if "corrupt.mp4" in filepath:
            return {"duration_seconds": 0.0, "filesize": os.path.getsize(filepath)}
        return {"duration_seconds": 10.0, "filesize": os.path.getsize(filepath)}
        
    monkeypatch.setattr(CampaignAssetService, "read_video_metadata", mocked_read)
    
    # Run scan
    res = client.post("/api/v1/campaign-scan", json={"campaign_folder": temp_dir})
    assert res.status_code == 200
    
    data = res.json()["data"]
    assert data["success"] is True
    
    summary = data["summary"]
    assert summary["detected"] == 3
    assert summary["available"] == 1
    assert summary["duplicate"] == 1
    assert summary["invalid"] == 1
    
    assets = data["assets"]
    assert len(assets) == 3
    
    # Assert Duplicate
    dup_asset = next(a for a in assets if a["filename"] == "duplicate.mp4")
    assert dup_asset["duplicate"] is True
    assert dup_asset["status"] == "CONSUMED"
    assert dup_asset["selectable"] is False
    
    # Assert New
    new_asset = next(a for a in assets if a["filename"] == "new_video.mp4")
    assert new_asset["duplicate"] is False
    assert new_asset["status"] == "NEW"
    assert new_asset["selectable"] is True
    
    # Assert Corrupt
    corr_asset = next(a for a in assets if a["filename"] == "corrupt.mp4")
    assert corr_asset["duplicate"] is False
    assert corr_asset["status"] == "INVALID"
    assert corr_asset["selectable"] is False

def test_campaign_scan_recursive(setup_db_and_files, monkeypatch):
    temp_dir = setup_db_and_files
    sub_dir = os.path.join(temp_dir, "nested_folder")
    os.makedirs(sub_dir)
    
    with open(os.path.join(sub_dir, "nested_video.mp4"), "wb") as f:
        f.write(b"nested")
        
    def mocked_read(filepath):
        return {"duration_seconds": 10.0, "filesize": os.path.getsize(filepath)}
        
    monkeypatch.setattr(CampaignAssetService, "read_video_metadata", mocked_read)
    
    res = client.post("/api/v1/campaign-scan", json={"campaign_folder": temp_dir})
    assert res.status_code == 200
    assert res.json()["data"]["summary"]["detected"] == 4 # 3 initial + 1 nested
