import os
import json
from sqlalchemy.orm import Session
from database.db import SessionLocal
from models import Channel, UploadTask
from services.watch_folder.validator import validate
from services.watch_folder.importer import create_task

def test_metadata_import():
    pkg_dir = os.path.abspath("test_metadata_pkg")
    os.makedirs(pkg_dir, exist_ok=True)
    
    with open(os.path.join(pkg_dir, "video.mp4"), "wb") as f:
        f.write(b"dummy content")
        
    metadata = {
        "title_final": "Sprint 8.6 Metadata Test",
        "video_id": "META_TEST_123",
        "description": "Testing AI Use, Category, and Language mapping.",
        "category": "20",
        "ai_use": "YES",
        "defaultLanguage": "id",
        "audioLanguage": "en",
        "recordingDate": "2026-06-25T10:00:00Z"
    }
    
    with open(os.path.join(pkg_dir, "metadata.json"), "w") as f:
        json.dump(metadata, f)
        
    db = SessionLocal()
    channel = db.query(Channel).first()
    if not channel:
        print("No channel found.")
        return
        
    result = validate(pkg_dir)
    print("Validation Success:", result.success)
    if not result.success:
        print("Error:", result.error_message)
        return
        
    task = create_task(result, channel, db)
    print("Task Created:", task.id)
    print("Category ID:", task.category_id)
    print("AI Use:", task.ai_use)
    print("Default Lang:", task.default_language)
    print("Audio Lang:", task.audio_language)
    print("Recording Date:", task.recording_date)

if __name__ == "__main__":
    test_metadata_import()
