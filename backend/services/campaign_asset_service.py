import hashlib
import os
import uuid
import logging
from typing import Set, Dict, Optional, Any
from sqlalchemy.orm import Session
from datetime import datetime

from models import CampaignAsset, CampaignAssetState
from services.media.video_metadata_service import VideoMetadataService

logger = logging.getLogger("CampaignAssetService")

class CampaignAssetService:
    
    @staticmethod
    def load_existing_fingerprints(db: Session) -> Set[str]:
        """Loads all existing fingerprints into a set for O(1) lookups."""
        records = db.query(CampaignAsset.fingerprint).all()
        return {r[0] for r in records}

    @staticmethod
    def calculate_sha256(file_path: str) -> str:
        """Calculates the SHA256 hash of a file using 64KB chunks."""
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for byte_block in iter(lambda: f.read(65536), b""):
                sha256_hash.update(byte_block)
        return sha256_hash.hexdigest()
        
    @staticmethod
    def read_video_metadata(file_path: str) -> dict:
        """Reads video metadata using VideoMetadataService."""
        # Using VideoMetadataService which returns dict with 'duration' string and 'size'
        # We need raw seconds. We'll use ffprobe directly if possible, or parse it.
        # Wait, the existing VideoMetadataService has a method to get metadata.
        import subprocess
        import json
        
        try:
            cmd = [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                file_path
            ]
            # Use subprocess to run ffprobe, this mimics the implementation in VideoMetadataService
            # to directly get the float duration.
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if result.returncode == 0:
                probe_data = json.loads(result.stdout)
                duration_sec = 0.0
                if 'format' in probe_data and 'duration' in probe_data['format']:
                    duration_sec = float(probe_data['format']['duration'])
                elif 'streams' in probe_data and len(probe_data['streams']) > 0 and 'duration' in probe_data['streams'][0]:
                    duration_sec = float(probe_data['streams'][0]['duration'])
                return {"duration_seconds": duration_sec, "filesize": os.path.getsize(file_path)}
        except Exception as e:
            logger.error(f"Failed to read metadata for {file_path}: {e}")
            
        return {"duration_seconds": 0.0, "filesize": os.path.getsize(file_path) if os.path.exists(file_path) else 0}

    @staticmethod
    def build_fingerprint(sha256: str, filesize: int, duration_seconds: float) -> str:
        """Builds the fingerprint from sha256, filesize, and duration."""
        # Format the float to avoid precision issues across different platforms/parsers
        # 3 decimal places should be sufficient for video duration identity
        raw_string = f"{sha256}-{filesize}-{duration_seconds:.3f}"
        return hashlib.sha256(raw_string.encode('utf-8')).hexdigest()
        
    @staticmethod
    def generate_fingerprint(file_path: str) -> dict:
        """Generates all fingerprint components for a file."""
        import time
        start_time = time.time()
        correlation_id = str(uuid.uuid4())[:8]
        
        sha256 = CampaignAssetService.calculate_sha256(file_path)
        meta = CampaignAssetService.read_video_metadata(file_path)
        
        filesize = meta.get("filesize", 0)
        duration = meta.get("duration_seconds", 0.0)
        
        fingerprint = CampaignAssetService.build_fingerprint(sha256, filesize, duration)
        
        elapsed = time.time() - start_time
        logger.info(f"[CampaignAsset] {correlation_id} {fingerprint} Duplicate:N/A {duration:.2f}s Elapsed:{elapsed:.2f}s")
        
        return {
            "fingerprint": fingerprint,
            "sha256": sha256,
            "filesize": filesize,
            "duration_seconds": duration
        }

    @staticmethod
    def find_by_fingerprint(db: Session, fingerprint: str) -> Optional[CampaignAsset]:
        return db.query(CampaignAsset).filter(CampaignAsset.fingerprint == fingerprint).first()

    @staticmethod
    def exists(db: Session, fingerprint: str) -> bool:
        return db.query(CampaignAsset).filter(CampaignAsset.fingerprint == fingerprint).first() is not None

    @staticmethod
    def create_asset(db: Session, asset_data: dict) -> CampaignAsset:
        asset = CampaignAsset(**asset_data)
        db.add(asset)
        db.commit()
        db.refresh(asset)
        return asset

    @staticmethod
    def mark_consumed(db: Session, fingerprint: str) -> Optional[CampaignAsset]:
        asset = CampaignAssetService.find_by_fingerprint(db, fingerprint)
        if asset:
            asset.status = CampaignAssetState.CONSUMED
            asset.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(asset)
        return asset

    @staticmethod
    def allow_reupload(db: Session, fingerprint: str, allow: bool = True) -> Optional[CampaignAsset]:
        asset = CampaignAssetService.find_by_fingerprint(db, fingerprint)
        if asset:
            asset.allow_reupload = allow
            asset.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(asset)
        return asset

    @staticmethod
    def archive(db: Session, fingerprint: str) -> Optional[CampaignAsset]:
        asset = CampaignAssetService.find_by_fingerprint(db, fingerprint)
        if asset:
            asset.status = CampaignAssetState.ARCHIVED
            asset.archived_at = datetime.utcnow()
            asset.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(asset)
        return asset

    @staticmethod
    def reset(db: Session, fingerprint: str) -> Optional[CampaignAsset]:
        asset = CampaignAssetService.find_by_fingerprint(db, fingerprint)
        if asset:
            asset.status = CampaignAssetState.NEW
            asset.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(asset)
        return asset
