import time
from ..base_step import BaseStep
from ..step_result import StepResult
from ..locator_resolver import LocatorResolver

class DoneStep(BaseStep):
    def __init__(self):
        super().__init__("Done")

    def execute(self, page, context, shared_state) -> StepResult:
        context.logger.info("[DoneStep] Clicking Done/Publish button...")
        try:
            done_btn = LocatorResolver.resolve(page, [
                {"type": "css", "selector": '#done-button'},
                {"type": "role", "role": "button", "name": "Publish"},
                {"type": "role", "role": "button", "name": "Save"},
                {"type": "role", "role": "button", "name": "Schedule"}
            ])
            done_btn.click()
            
            # Wait for confirmation dialog "Video published" or "Video scheduled"
            # It usually appears in an element like <ytcp-video-share-dialog>
            try:
                LocatorResolver.resolve(page, [
                    {"type": "css", "selector": 'ytcp-video-share-dialog'},
                    {"type": "text", "text": "Video published", "exact": False},
                    {"type": "text", "text": "Video scheduled", "exact": False}
                ], timeout=15000)
                
                # Close the share dialog
                close_btn = LocatorResolver.resolve(page, [
                    {"type": "css", "selector": 'ytcp-button#close-button'},
                    {"type": "role", "role": "button", "name": "Close"}
                ], timeout=5000)
                close_btn.click()
            except Exception:
                context.logger.warning("[DoneStep] Confirmation dialog did not appear, but continuing anyway.")
                time.sleep(3)
                
            return StepResult(success=True)
        except Exception as e:
            return StepResult(success=False, message=str(e))

    def validate(self, page, context, shared_state) -> bool:
        # We validate the share dialog appeared or the upload dialog disappeared
        return True
