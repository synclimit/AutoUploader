import time
import logging
import threading
import json
from datetime import datetime, timedelta

from database.db import SessionLocal
from models import Channel
from core.engine_base import EngineBase
from services.channel_service import ChannelService
from services.oauth_core.oauth_repository import OAuthRepository
from services.oauth_core.oauth_client import OAuthClient

logger = logging.getLogger("metadata_sync_scheduler")

SYNC_INTERVAL_HOURS = 24
POLL_INTERVAL_SECONDS = 3600 # Wake up every hour to check

class MetadataSyncEngine(EngineBase):
    def __init__(self):
        self._thread = None
        self._running = False
        logger.info("[METADATA_SYNC] Initialized")

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._running = True
        self._thread = threading.Thread(
            target=self._run_loop,
            name="MetadataSyncEngine",
            daemon=True,
        )
        self._thread.start()
        logger.info(f"[METADATA_SYNC] Started — polling every {POLL_INTERVAL_SECONDS}s")

    def stop(self):
        self._running = False
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=10)

    def restart(self):
        self.stop()
        self.start()

    def status(self) -> dict:
        return {"status": "running" if self._running else "stopped"}

    def health(self) -> dict:
        return {"status": "running" if self._running else "stopped"}

    def _run_loop(self):
        while self._running:
            self._sync_channels()
            for _ in range(POLL_INTERVAL_SECONDS):
                if not self._running:
                    break
                time.sleep(1)

    def _sync_channels(self):
        db = SessionLocal()
        try:
            channels = db.query(Channel).all()
            for channel in channels:
                try:
                    adv_settings = {}
                    if channel.advanced_settings:
                        adv_settings = json.loads(channel.advanced_settings)
                    
                    last_sync = adv_settings.get("last_metadata_sync")
                    now = datetime.utcnow()
                    
                    if last_sync:
                        last_sync_dt = datetime.fromisoformat(last_sync)
                        if (now - last_sync_dt) < timedelta(hours=SYNC_INTERVAL_HOURS):
                            continue # Skip, not 24 hours yet
                            
                    logger.info(f"[METADATA_SYNC] Syncing channel {getattr(channel, 'channel_name', channel.id)}")
                    
                    token = OAuthRepository.load_token(db, channel.id)
                    if not token:
                        continue
                        
                    from googleapiclient.discovery import build
                    creds = OAuthClient.build_credentials(token, channel.id)
                    youtube = build("youtube", "v3", credentials=creds, static_discovery=False)
                    
                    res = youtube.channels().list(mine=True, part="snippet,statistics").execute()
                    if res.get("items"):
                        item = res["items"][0]
                        channel.subscribers = item.get("statistics", {}).get("subscriberCount", "0")
                        avatar = item.get("snippet", {}).get("thumbnails", {}).get("default", {}).get("url")
                        if avatar:
                            channel.avatar_url = avatar
                        
                        yt_name = item.get("snippet", {}).get("title")
                        if yt_name:
                            channel.youtube_name = yt_name
                            
                        # Save last sync time
                        adv_settings["last_metadata_sync"] = now.isoformat()
                        channel.advanced_settings = json.dumps(adv_settings)
                        db.commit()
                        logger.info(f"[METADATA_SYNC] Successfully updated metadata for {getattr(channel, 'channel_name', channel.id)}")
                        
                except Exception as e:
                    logger.error(f"[METADATA_SYNC] Failed to sync channel {channel.id}: {e}")
                    db.rollback()
        finally:
            db.close()

_sync_instance = None

def get_metadata_sync_engine() -> MetadataSyncEngine:
    global _sync_instance
    if _sync_instance is None:
        _sync_instance = MetadataSyncEngine()
    return _sync_instance
