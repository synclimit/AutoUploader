from ..base_step import BaseStep
from ..step_result import StepResult
from ..locator_resolver import LocatorResolver

class UploadVideoStep(BaseStep):
    def __init__(self):
        super().__init__("UploadVideo")

    def execute(self, page, context, shared_state) -> StepResult:
        task = context.task
        context.logger.info(f"[UploadVideoStep] Setting video file: {task.video_path}")
        
        # The file input is often hidden, so we cannot wait for it to be visible. We wait for it to be attached.
        file_input = page.locator('input[type="file"]').first
        file_input.wait_for(state="attached", timeout=15000)
        file_input.set_input_files(task.video_path)
        
        return StepResult(success=True)

    def validate(self, page, context, shared_state) -> bool:
        # After setting the file, the dialog should transition to the details view (where title/description are)
        try:
            LocatorResolver.resolve(page, [
                {"type": "css", "selector": 'div#textbox'},
                {"type": "text", "text": "Details", "exact": False}
            ], timeout=15000)
            return True
        except Exception:
            return False
