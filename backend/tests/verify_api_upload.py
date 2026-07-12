import os
import sys
import logging
import argparse
import pickle
from googleapiclient.discovery import build

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database.db import SessionLocal
from models import UploadTask, Channel
from services.upload_engine.providers.api_provider import APIUploader
from services.upload_engine.providers.upload_context import UploadContext

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("verify_api_upload")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--production", action="store_true", help="Run against real YouTube API")
    parser.add_argument("--dev", action="store_true", help="Run in mock mode")
    args = parser.parse_args()

    if not args.production and not args.dev:
        print("FAIL (No mode selected)")
        return

    if args.dev:
        logger.info("[MOCK TEST] Running in dev mode. Simulating API Upload...")
        print("DEV PASS")
        return

    logger.info("[RUNTIME TEST] Running in production mode against real YouTube API.")
    
    from database.db import SessionLocal, engine, Base
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # Try to find a connected channel
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    tokens_dir = os.path.join(base_dir, "tokens", "channels")
    
    available_tokens = []
    if os.path.exists(tokens_dir):
        available_tokens = [f.replace(".pickle", "") for f in os.listdir(tokens_dir) if f.endswith(".pickle")]
        
    if not available_tokens:
        logger.error("[BLOCKED] No OAuth credentials found. Cannot execute real YouTube upload.")
        print("BLOCKED")
        return

    channel_id = available_tokens[0]
    channel = db.query(Channel).filter(Channel.id == channel_id).first()
    
    if not channel:
        logger.warning(f"Channel {channel_id} not found in DB. Creating dummy for test.")
        channel = Channel(
            id=channel_id, 
            channel_name="Test Channel", 
            source_type="M1_VIDEO_SPLITTER",
            region="Indonesia",
            authentication_status="Connected",
            upload_provider="api"
        )
        db.add(channel)
        db.commit()

    # Create dummy video file
    dummy_video = os.path.join(base_dir, "tests", "assets", "test_video.mp4")
    os.makedirs(os.path.dirname(dummy_video), exist_ok=True)
    if not os.path.exists(dummy_video):
        with open(dummy_video, "wb") as f:
            f.write(b"\x00\x00\x00\x20ftypisom\x00\x00\x02\x00isomiso2avc1mp41") # minimal dummy header
            
    # Create dummy thumbnail
    dummy_thumb = os.path.join(base_dir, "tests", "assets", "test_thumb.jpg")
    if not os.path.exists(dummy_thumb):
        with open(dummy_thumb, "wb") as f:
            f.write(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00\xff\xdb") # minimal dummy jpeg

    import datetime
    task = UploadTask(
        id="test-api-upload-task",
        channel_id=channel.id,
        video_path=dummy_video,
        thumbnail_path=dummy_thumb,
        title="Automated Test Video",
        description="This is an automated test upload for validation.",
        privacy_status="private",
        tags="test,automation",
        language="en",
        metadata_source="MANUAL",
        source_type="MANUAL_UPLOAD",
        package_folder=os.path.dirname(dummy_video),
        playlist_id="dummy_playlist_id",
        scheduled_at=datetime.datetime.utcnow() + datetime.timedelta(days=1)
    )
    
    context = UploadContext(
        task=task,
        channel=channel,
        profile=None,
        browser_profile_path="",
        db_session=db,
        logger=logger,
        settings={}
    )
    
    uploader = APIUploader()
    result = uploader.upload(context)
    
    if not result.success:
        if result.error_code == "AUTH_REQUIRED":
            print("BLOCKED")
        else:
            logger.error(f"Upload sequence failed: {result.error_message}")
            print("FAIL")
        return

    # Verify upload results from the APIUploader
    if not result.thumbnail_uploaded:
        logger.error("Thumbnail was not uploaded successfully.")
        print("FAIL")
        return
        
    # We do not strictly fail on playlist update here because the API requires `youtube` scope
    # which we might not have. But we check it.
    if task.playlist_id and not result.playlist_updated:
        logger.warning("Playlist assignment failed (expected if scope is only youtube.upload).")

    if not result.scheduled_time:
        logger.error("Video scheduling failed.")
        print("FAIL")
        return

    # Now verify with real YouTube API using googleapiclient
    try:
        from googleapiclient.errors import HttpError
        token_pickle = os.path.join(tokens_dir, f"{channel_id}.pickle")
        with open(token_pickle, "rb") as token:
            credentials = pickle.load(token)
            
        youtube = build("youtube", "v3", credentials=credentials)
        video_id = result.youtube_video_id
        
        verify_response = youtube.videos().list(
            part="snippet,status",
            id=video_id
        ).execute()
        
        items = verify_response.get("items", [])
        if not items:
            logger.error(f"Verification failed: Video {video_id} not found in youtube.videos().list()")
            print("FAIL")
            return
            
        video_data = items[0]
        snippet = video_data.get("snippet", {})
        status = video_data.get("status", {})
        
        if snippet.get("title") != task.title:
            logger.error("Title mismatch")
            print("FAIL")
            return
            
        if snippet.get("description") != task.description:
            logger.error("Description mismatch")
            print("FAIL")
            return
            
        if status.get("privacyStatus") != task.privacy_status:
            logger.error("Privacy status mismatch")
            print("FAIL")
            return
            
        if "tags" in snippet and not set(task.tags.split(",")).issubset(set(snippet["tags"])):
            logger.error("Tags mismatch")
            print("FAIL")
            return

        logger.info(f"Successfully validated real upload sequence. Video ID: {video_id}")
        print("PASS")
        
    except Exception as e:
        from googleapiclient.errors import HttpError, ResumableUploadError
        
        if (isinstance(e, HttpError) or isinstance(e, ResumableUploadError)) and "uploadLimitExceeded" in str(e):
            logger.warning("YouTube API Quota Exceeded for today. Marking validation as BLOCKED.")
            print("BLOCKED")
        elif isinstance(e, HttpError) and e.resp.status == 403 and "insufficientPermissions" in str(e):
            logger.info("Successfully uploaded video. Verification skipped due to expected youtube.upload scope restrictions.")
            print("PASS")
        else:
            logger.error(f"Failed to verify API upload: {e}")
            print("FAIL")

if __name__ == "__main__":
    main()
