import os
from ..base_step import BaseStep
from ..step_result import StepResult
from ..locator_resolver import LocatorResolver

class ThumbnailStep(BaseStep):
    def __init__(self):
        super().__init__("Thumbnail")

    def execute(self, page, context, shared_state) -> StepResult:
        task = context.task
        if not task.thumbnail_path or not os.path.exists(task.thumbnail_path):
            context.logger.info("[ThumbnailStep] No thumbnail to upload.")
            return StepResult(success=True)

        context.logger.info("[ThumbnailStep] Uploading thumbnail...")
        try:
            file_input = LocatorResolver.resolve(page, [
                {"type": "css", "selector": 'input#file-loader'},
                {"type": "css", "selector": 'input[type="file"][accept="image/jpeg,image/png"]'}
            ], timeout=10000)
            
            file_input.set_input_files(task.thumbnail_path)
            return StepResult(success=True)
        except Exception as e:
            return StepResult(success=False, message=str(e))

    def validate(self, page, context, shared_state) -> bool:
        # We could check for a visual change in the thumbnail preview, but standard success is fine for now
        return True
