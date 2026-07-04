import os
import time
import traceback
from playwright.sync_api import sync_playwright

from .base_provider import BaseUploader
from .upload_context import UploadContext
from .upload_result import UploadResult

from ..browser.profile_manager import ProfileManager
from ..browser.browser_launcher import BrowserLauncher
from ..browser.session_validator import SessionValidator

# Navigator
from ..browser.navigator.workflow_engine import WorkflowEngine
from ..browser.navigator.evidence_collector import EvidenceCollector
from ..browser.navigator.retry_policy import RetryPolicy

# Steps
from ..browser.navigator.steps.open_studio import OpenStudioStep
from ..browser.navigator.steps.upload_video import UploadVideoStep
from ..browser.navigator.steps.extract_video import ExtractVideoStep
from ..browser.navigator.steps.metadata import MetadataStep
from ..browser.navigator.steps.thumbnail import ThumbnailStep
from ..browser.navigator.steps.audience import AudienceStep
from ..browser.navigator.steps.playlist import PlaylistStep
from ..browser.navigator.steps.processing import ProcessingStep
from ..browser.navigator.steps.visibility import VisibilityStep
from ..browser.navigator.steps.schedule import ScheduleStep
from ..browser.navigator.steps.done import DoneStep
from ..browser.navigator.steps.draft_detection import DraftDetectionStep


class PlaywrightUploader(BaseUploader):
    def upload(self, context: UploadContext) -> UploadResult:
        task = context.task
        logger = context.logger
        
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        evidence_dir = os.path.join(base_dir, "evidence")
        
        # Instantiate Browser Services
        profile_manager = ProfileManager(base_dir)
        browser_launcher = BrowserLauncher(headless=False)
        session_validator = SessionValidator()
        
        try:
            start_time = time.time()
            profile_name = "youtube_automation" # Hardcoded or fetched from context.account
            
            profile_path = profile_manager.resolve_profile_path(profile_name)
            if not profile_manager.validate_profile(profile_path):
                return UploadResult(
                    success=False,
                    error_code="INVALID_BROWSER_PROFILE",
                    error_message=f"Browser profile at {profile_path} is invalid or missing."
                )

            with sync_playwright() as p:
                logger.info(f"[PlaywrightUploader] Launching browser with profile {profile_name}")
                browser_context = browser_launcher.launch(p, profile_path)
                
                try:
                    page = browser_context.pages[0] if browser_context.pages else browser_context.new_page()
                    
                    logger.info("[PlaywrightUploader] Validating YouTube Studio session...")
                    is_authenticated = session_validator.validate(page)
                    
                    if not is_authenticated:
                        return UploadResult(
                            success=False,
                            error_code="AUTH_REQUIRED",
                            error_message="YouTube Studio session is not authenticated. Login required."
                        )
                    
                    # Execution ID based on task ID or timestamp
                    execution_id = f"EXEC-{task.id[:8]}" if task.id else f"EXEC-{int(time.time())}"
                    evidence_collector = EvidenceCollector(evidence_dir, execution_id)
                    
                    engine = WorkflowEngine(evidence_collector)
                    
                    # Add steps to engine
                    engine.add_step(OpenStudioStep(), RetryPolicy(max_attempts=3, delay_seconds=2))
                    engine.add_step(UploadVideoStep(), RetryPolicy(max_attempts=1)) # File upload rarely fails if path is correct
                    engine.add_step(ExtractVideoStep(), RetryPolicy(max_attempts=5, delay_seconds=3))
                    engine.add_step(MetadataStep(), RetryPolicy(max_attempts=3, delay_seconds=2))
                    engine.add_step(ThumbnailStep(), RetryPolicy(max_attempts=2, delay_seconds=2))
                    engine.add_step(AudienceStep(), RetryPolicy(max_attempts=2, delay_seconds=2))
                    engine.add_step(PlaylistStep(), RetryPolicy(max_attempts=2, delay_seconds=2))
                    engine.add_step(ProcessingStep(), RetryPolicy(max_attempts=1)) # Processing handles its own long wait
                    engine.add_step(VisibilityStep(), RetryPolicy(max_attempts=3, delay_seconds=3))
                    engine.add_step(ScheduleStep(), RetryPolicy(max_attempts=3, delay_seconds=2))
                    engine.add_step(DoneStep(), RetryPolicy(max_attempts=3, delay_seconds=2))
                    engine.add_step(DraftDetectionStep(), RetryPolicy(max_attempts=3, delay_seconds=5))
                    
                    # Store context attributes for steps to use
                    engine.state["extracted_video_id"] = None
                    engine.state["extracted_video_url"] = None
                    engine.state["final_visibility"] = None
                    
                    engine_result = engine.execute(page, context)
                    
                    duration = time.time() - start_time
                    
                    # Compile final UploadResult
                    final_result = UploadResult(
                        success=engine_result.success,
                        youtube_video_id=engine.state.get("extracted_video_id"),
                        youtube_url=engine.state.get("extracted_video_url"),
                        visibility=engine.state.get("final_visibility"),
                        publish_state=engine.state.get("final_visibility"),
                        upload_duration=duration,
                        thumbnail_uploaded=(task.thumbnail_path is not None),
                        playlist_updated=bool(getattr(task, "playlist_title", False)),
                        metadata_updated=True,
                        scheduled_time=task.scheduled_at.isoformat() if task.scheduled_at else None,
                        steps_completed=len([t for t in evidence_collector.timeline if t["status"] == "PASS"]),
                        failed_step=evidence_collector.timeline[-1]["step"] if not engine_result.success else None,
                        error_code="VIDEO_STILL_DRAFT" if "VIDEO_STILL_DRAFT" in str(engine_result.message) else ("PLAYWRIGHT_UPLOAD_ERROR" if not engine_result.success else None),
                        error_message=engine_result.message if not engine_result.success else None
                    )
                    
                    # Save evidence artifacts
                    evidence_collector.save_timeline()
                    evidence_collector.save_upload_result(final_result.__dict__)
                    
                    report_data = {
                        "Execution ID": execution_id,
                        "Video ID": final_result.youtube_video_id,
                        "Video URL": final_result.youtube_url,
                        "Duration": f"{final_result.upload_duration:.2f}s",
                        "Success": final_result.success,
                        "Final Visibility": final_result.visibility,
                        "Steps Completed": final_result.steps_completed,
                        "Error Message": final_result.error_message
                    }
                    evidence_collector.generate_report(report_data)
                    
                    return final_result
                    
                finally:
                    # PlaywrightUploader never stores browser references internally.
                    browser_context.close()
                    
        except Exception as e:
            return UploadResult(
                success=False,
                error_code="PLAYWRIGHT_UPLOAD_ERROR",
                error_message=str(e) + "\n" + traceback.format_exc()
            )
