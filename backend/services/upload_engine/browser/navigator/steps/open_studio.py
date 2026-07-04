from ..base_step import BaseStep
from ..step_result import StepResult
from ..locator_resolver import LocatorResolver

class OpenStudioStep(BaseStep):
    def __init__(self):
        super().__init__("OpenStudio")

    def execute(self, page, context, shared_state) -> StepResult:
        context.logger.info("[OpenStudioStep] Navigating to upload page...")
        page.goto("https://studio.youtube.com/channel/UC/videos?d=ud", wait_until="networkidle", timeout=30000)
        return StepResult(success=True)

    def validate(self, page, context, shared_state) -> bool:
        # Check if the upload dialog is visible or the file input is present
        try:
            LocatorResolver.resolve(page, [
                {"type": "css", "selector": 'input[type="file"]'},
                {"type": "css", "selector": 'ytcp-uploads-dialog'}
            ], timeout=15000)
            return True
        except Exception:
            return False
