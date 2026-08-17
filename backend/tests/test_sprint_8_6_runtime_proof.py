import os
import time
import uuid
import shutil
import pytest
from database.db import SessionLocal, Base, engine as db_engine
from models import Channel, UploadTask
from services.watch_folder.engine import get_engine

import tempfile

def setup_module(module):
    Base.metadata.create_all(bind=db_engine)

def teardown_module(module):
    pass

def test_sprint_8_6_stress_and_runtime_proof():
    watch_dir = tempfile.mkdtemp(prefix="watch_stress_")
    db = SessionLocal()
    
    # 1. Prepare Mock Channel
    import json
    channel_id = str(uuid.uuid4())
    channel = Channel(
        id=channel_id,
        channel_name=f"Stress Test Channel {channel_id[:8]}",
        watch_folder=watch_dir,
        watch_folder_enabled=True,
        pipelines=json.dumps({
            "long": {
                "enabled": True,
                "watch_folder": watch_dir,
                "daily_limit": 200,
                "processing_order": "oldest_first"
            }
        })
    )
    db.add(channel)
    db.commit()

    try:
        # 2. Drop 100 packages
        # 50 direct videos
        for i in range(50):
            with open(os.path.join(watch_dir, f"direct_video_{i}.mp4"), "wb") as f:
                f.write(b"0" * 1024 * (100 + i)) # Unique size
                
        # 30 standard folders
        for i in range(30):
            folder = os.path.join(watch_dir, f"package_folder_{i}")
            os.makedirs(folder)
            with open(os.path.join(folder, "metadata.json"), "w") as f:
                f.write('{"title": "Standard Video"}')
            with open(os.path.join(folder, "video.mp4"), "wb") as f:
                f.write(b"1" * 1024 * (50 + i)) # Unique size
                
        # 20 complex folders (multiple videos)
        for i in range(20):
            folder = os.path.join(watch_dir, f"complex_folder_{i}")
            os.makedirs(folder)
            with open(os.path.join(folder, "metadata.json"), "w") as f:
                f.write('{"title": "Complex Video"}')
            with open(os.path.join(folder, "video_a.mp4"), "wb") as f:
                f.write(b"2" * 1024 * (10 + i))
            with open(os.path.join(folder, "video_b.mp4"), "wb") as f:
                f.write(b"3" * 1024 * (200 + i)) # largest, should be selected
            with open(os.path.join(folder, "video_c.mp4"), "wb") as f:
                f.write(b"4" * 1024 * (5 + i))
        
        # Give files time to stabilize (st_mtime > 3 seconds)
        print("Waiting for stability window (4 seconds)...")
        time.sleep(4)

        # Drop 1 file that is "copying" (size 0, not stable)
        with open(os.path.join(watch_dir, "copying_video.mp4"), "wb") as f:
            f.write(b"")

        # 3. Run Engine Scan
        engine = get_engine()
        summary = engine.scan_now(channel_id=channel_id, pipeline_type="long")

        # 4. Assertions
        # 50 + 30 + 20 = 100 packages found (stable ones)
        # The copying_video.mp4 shouldn't be picked up yet because it's size 0
        assert summary.success is True
        assert summary.packages_found == 100
        assert summary.tasks_created == 100
        assert summary.validation_errors == 0
        assert summary.duplicates_skipped == 0
        
        # Verify DB records
        tasks = db.query(UploadTask).filter(UploadTask.channel_id == channel_id).all()
        assert len(tasks) == 100
        
        # 5. Run manual scan again -> Should trigger 100 duplicates + 1 new task for the copying_video now that it's stable
        with open(os.path.join(watch_dir, "copying_video.mp4"), "wb") as f:
            f.write(b"completed video data")
        time.sleep(4) # Wait for copying_video to become stable
        summary2 = engine.scan_now(channel_id=channel_id, pipeline_type="long")
        
        assert summary2.packages_found == 101
        assert summary2.tasks_created == 1  # The newly stable one
        assert summary2.validation_errors == 0
        
        # Total tasks
        tasks_final = db.query(UploadTask).filter(UploadTask.channel_id == channel_id).all()
        assert len(tasks_final) == 101

    finally:
        db.query(UploadTask).filter(UploadTask.channel_id == channel_id).delete()
        db.delete(channel)
        db.commit()
        db.close()
        if os.path.exists(watch_dir):
            shutil.rmtree(watch_dir, ignore_errors=True)

