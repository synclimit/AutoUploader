import os
import sys

# Mock googleapiclient
class MockYouTubeVideos:
    def insert(self, part, body, media_body, notifySubscribers):
        print(f"\n--- YOUTUBE API REQUEST ---")
        print(f"Parts: {part}")
        print(f"Body: {body}")
        print(f"Notify: {notifySubscribers}")
        class MockRequest:
            def next_chunk(self):
                return None, {"id": "YOUTUBE_ID_123"}
        return MockRequest()
        
    def list(self, part, id):
        class MockList:
            def execute(self):
                return {"items": [{"id": id, "status": {}}]}
        return MockList()

class MockYouTubeThumbnails:
    def set(self, videoId, media_body):
        class MockSet:
            def execute(self):
                pass
        return MockSet()
        
class MockYouTubePlaylistItems:
    def insert(self, part, body):
        class MockInsert:
            def execute(self):
                pass
        return MockInsert()

class MockYouTube:
    def videos(self): return MockYouTubeVideos()
    def thumbnails(self): return MockYouTubeThumbnails()
    def playlistItems(self): return MockYouTubePlaylistItems()

# Inject the mock
import sys
import mock_googleapiclient
sys.modules['googleapiclient.discovery'] = mock_googleapiclient
sys.modules['googleapiclient.http'] = mock_googleapiclient

from database.db import SessionLocal
from models import UploadTask
from services.upload_engine.providers.api_provider import APIUploader
from services.upload_engine.providers.upload_context import UploadContext
import logging

def test_api_provider():
    db = SessionLocal()
    task = db.query(UploadTask).filter_by(id='40f28739-c876-4235-b321-4f980cedd2ef').first()
    
    # We need a dummy video path
    with open("dummy.mp4", "w") as f: f.write("video")
    task.video_path = "dummy.mp4"
    
    # Need to skip auth. So we'll patch build.
    def mock_build(*args, **kwargs):
        return MockYouTube()
    mock_googleapiclient.build = mock_build
    
    # Also patch MediaFileUpload
    class MockMediaFileUpload:
        def __init__(self, *args, **kwargs): pass
    mock_googleapiclient.MediaFileUpload = MockMediaFileUpload

    class MockLogger:
        def info(self, msg): print("INFO:", msg)
        def warning(self, msg): print("WARN:", msg)
        def error(self, msg): print("ERROR:", msg)

    context = UploadContext(
        task=task,
        account=None,
        profile=None,
        logger=MockLogger(),
        browser_profile_path="",
        db_session=None,
        settings={}
    )
    
    # We also need to bypass token check
    # Let's override os.path.exists for the token
    original_exists = os.path.exists
    def mock_exists(path):
        if "pickle" in path: return True
        return original_exists(path)
    os.path.exists = mock_exists
    
    # and bypass pickle.load
    import pickle
    original_load = pickle.load
    def mock_load(f):
        return "mock_credentials"
    pickle.load = mock_load
    
    uploader = APIUploader()
    result = uploader.upload(context)
    
    print("\nUpload Result Success:", result.success)

if __name__ == "__main__":
    test_api_provider()
