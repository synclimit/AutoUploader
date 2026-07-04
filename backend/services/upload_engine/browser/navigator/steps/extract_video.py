from ..base_step import BaseStep
from ..step_result import StepResult
from ..locator_resolver import LocatorResolver

class ExtractVideoStep(BaseStep):
    def __init__(self):
        super().__init__("ExtractVideo")

    def execute(self, page, context, shared_state) -> StepResult:
        context.logger.info("[ExtractVideoStep] Extracting Video ID...")
        try:
            video_url_elem = LocatorResolver.resolve(page, [
                {"type": "css", "selector": '.video-url-fadeable a'},
                {"type": "css", "selector": 'a.ytcp-video-info'}
            ], timeout=15000)
            
            youtube_url = video_url_elem.get_attribute("href")
            video_id = youtube_url.split("/")[-1] if youtube_url else "UNKNOWN_ID"
            
            context.logger.info(f"[ExtractVideoStep] Extracted Video ID: {video_id}")
            shared_state["extracted_video_id"] = video_id
            shared_state["extracted_video_url"] = youtube_url
            return StepResult(success=True)
        except Exception as e:
            return StepResult(success=False, message=str(e))

    def validate(self, page, context, shared_state) -> bool:
        return shared_state.get("extracted_video_id", "UNKNOWN_ID") != "UNKNOWN_ID"
