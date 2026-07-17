import time
from ..base_step import BaseStep
from ..step_result import StepResult
from ..locator_resolver import LocatorResolver

class DraftDetectionStep(BaseStep):
    def __init__(self):
        super().__init__("DraftDetection")

    def execute(self, page, context, shared_state) -> StepResult:
        context.logger.info("[DraftDetectionStep] Verifying video is not Draft...")
        try:
            # We should be back on the Content page (studio.youtube.com/channel/UC/videos)
            page.wait_for_selector('ytcp-video-row', state="visible", timeout=15000)
            
            # Find the row for our extracted video id
            video_id = shared_state.get("extracted_video_id") or getattr(context, "extracted_video_id", None)
            if not video_id or video_id == "UNKNOWN_ID":
                # If we don't know the ID, just check the first row
                row = page.locator('ytcp-video-row').first
            else:
                # Find row containing the video ID in its href (e.g., thumbnail link)
                row = page.locator(f'ytcp-video-row:has(a[href*="{video_id}"])').first
                
            # Check the visibility column
            visibility_cell = row.locator('.column-visibility').first
            visibility_text = visibility_cell.inner_text().lower()
            
            context.logger.info(f"[DraftDetectionStep] Video visibility cell: {visibility_text}")
            
            if "draft" in visibility_text:
                return StepResult(success=False, message="VIDEO_STILL_DRAFT")
                
            shared_state["final_visibility"] = visibility_text
            return StepResult(success=True)
        except Exception as e:
            # Sometimes Playwright timeouts here if the page is slow.
            # We'll assume success=False if we can't confirm.
            return StepResult(success=False, message=f"Failed to detect draft status: {e}")

    def validate(self, page, context, shared_state) -> bool:
        return True
