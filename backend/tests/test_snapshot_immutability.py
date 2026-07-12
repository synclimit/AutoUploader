import os
import sys
import pytest
from datetime import datetime

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import SessionLocal
from models import UploadTask, GlobalSettings, Channel, Profile

def test_upload_task_immutability():
    db = SessionLocal()
    
    # 1. Create initial settings
    pref = GlobalSettings(general_theme="dark", general_language="en", upload_concurrent=3)
    profile = Profile(id="test_profile", name="Default Profile", content_type="Longform (16:9)")
    channel = Channel(id="test_account", channel_name="Test Channel", publish_visibility="private", language="en")
    
    db.add_all([pref, profile, channel])
    db.commit()
    
    # 2. Create UploadTask based on these settings
    task = UploadTask(
        id="test_immutable_task",
        channel_id="test_account",
        title="Original Title",
        description="Original Description",
        privacy_status="private",
        tags="test,vlog",
        language="en",
        source_type="MANUAL_UPLOAD",
        metadata_source="MANUAL",
        package_folder="/test/pkg",
        video_path="/test/pkg/vid.mp4"
    )
    db.add(task)
    db.commit()
    
    # 3. Modify settings
    pref.general_theme = "light"
    pref.upload_concurrent = 10
    channel.publish_visibility = "public"
    channel.language = "id"
    profile.name = "Updated Profile"
    db.commit()
    
    # 4. Refetch UploadTask and verify it remains unchanged
    refetched_task = db.query(UploadTask).filter(UploadTask.id == "test_immutable_task").first()
    
    assert refetched_task.title == "Original Title"
    assert refetched_task.description == "Original Description"
    assert refetched_task.privacy_status == "private"
    assert refetched_task.tags == "test,vlog"
    assert refetched_task.language == "en"
    
    # Cleanup
    db.delete(refetched_task)
    db.delete(pref)
    db.delete(channel)
    db.delete(profile)
    db.commit()
    db.close()
    
    print("PASS")

if __name__ == "__main__":
    test_upload_task_immutability()
