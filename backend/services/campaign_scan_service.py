import os
from typing import List
from sqlalchemy.orm import Session
from services.campaign_asset_service import CampaignAssetService
from schemas import CampaignScanSummary, CampaignScanAsset, CampaignScanResponse

class CampaignScanService:
    SUPPORTED_EXTENSIONS = {'.mp4', '.mov', '.mkv', '.avi', '.webm'}

    @staticmethod
    def scan_folder(db: Session, folder_path: str) -> CampaignScanResponse:
        """
        Scans a given folder recursively for supported video files,
        generates fingerprints using streaming 64KB chunks,
        compares against O(1) memory cache of existing assets,
        and returns a read-only scan result.
        """
        if not folder_path or not os.path.exists(folder_path):
            return CampaignScanResponse(
                success=False,
                summary=CampaignScanSummary(),
                assets=[]
            )

        # 1. Preload existing fingerprints into O(1) Set cache
        existing_fingerprints = CampaignAssetService.load_existing_fingerprints(db)
        
        detected = 0
        available = 0
        duplicate = 0
        invalid = 0
        
        assets: List[CampaignScanAsset] = []

        # 2. Recursively scan the folder
        for root, _, files in os.walk(folder_path):
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext not in CampaignScanService.SUPPORTED_EXTENSIONS:
                    continue
                
                filepath = os.path.join(root, file)
                detected += 1
                
                # 3. Process video
                try:
                    # Generate SHA256 using 64KB chunks (constant memory)
                    sha256_hash = CampaignAssetService.calculate_sha256(filepath)
                    
                    # Read metadata (duration and filesize)
                    meta = CampaignAssetService.read_video_metadata(filepath)
                    duration_seconds = meta["duration_seconds"]
                    filesize = meta["filesize"]
                    
                    if duration_seconds == 0.0:
                        invalid += 1
                        status = "INVALID"
                        is_duplicate = False
                        selectable = False
                        fingerprint = "INVALID_METADATA"
                    else:
                        # Build fingerprint
                        fingerprint = CampaignAssetService.build_fingerprint(
                            sha256=sha256_hash,
                            filesize=filesize,
                            duration_seconds=duration_seconds
                        )
                        
                        # O(1) Cache lookup
                        if fingerprint in existing_fingerprints:
                            is_duplicate = True
                            status = "CONSUMED"
                            selectable = False
                            duplicate += 1
                        else:
                            is_duplicate = False
                            status = "NEW"
                            selectable = True
                            available += 1
                            
                    # Append asset result
                    assets.append(CampaignScanAsset(
                        filename=file,
                        filepath=filepath,
                        filesize=filesize,
                        duration_seconds=duration_seconds,
                        fingerprint=fingerprint,
                        duplicate=is_duplicate,
                        status=status,
                        selectable=selectable
                    ))
                    
                except Exception as e:
                    # Never crash scanner on individual file failure
                    invalid += 1
                    assets.append(CampaignScanAsset(
                        filename=file,
                        filepath=filepath,
                        filesize=0,
                        duration_seconds=0.0,
                        fingerprint="ERROR",
                        duplicate=False,
                        status="INVALID",
                        selectable=False
                    ))

        # 3. Create Summary and Response
        summary = CampaignScanSummary(
            detected=detected,
            available=available,
            duplicate=duplicate,
            invalid=invalid,
            videos_to_upload=available, # Defaulting available to videos_to_upload
            estimated_coverage="0 days" # Frontend preview only
        )
        
        return CampaignScanResponse(
            success=True,
            summary=summary,
            assets=assets
        )
