import time
from ..base_step import BaseStep
from ..step_result import StepResult
from ..locator_resolver import LocatorResolver

class VisibilityStep(BaseStep):
    def __init__(self):
        super().__init__("Visibility")

    def execute(self, page, context, shared_state) -> StepResult:
        context.logger.info("[VisibilityStep] Navigating to Visibility tab...")
        
        # Click Next until we are on the Visibility tab
        for _ in range(3):
            try:
                next_btn = LocatorResolver.resolve(page, [
                    {"type": "css", "selector": '#next-button'},
                    {"type": "role", "role": "button", "name": "Next"}
                ], timeout=5000)
                next_btn.click()
                time.sleep(1) # small transition delay
            except Exception:
                pass
                
        # Now set visibility
        visibility = context.task.visibility.upper() if context.task.visibility else "PRIVATE"
        context.logger.info(f"[VisibilityStep] Setting visibility to {visibility}...")
        
        try:
            # Expand the "Save or publish" section if it's collapsed (sometimes it is)
            try:
                LocatorResolver.resolve(page, [
                    {"type": "css", "selector": '#first-container tp-yt-paper-radio-button'}
                ], timeout=3000).click()
            except:
                pass

            vis_radio = LocatorResolver.resolve(page, [
                {"type": "css", "selector": f'tp-yt-paper-radio-button[name="{visibility}"]'},
                {"type": "role", "role": "radio", "name": visibility.capitalize()}
            ], timeout=10000)
            vis_radio.click()
            
            return StepResult(success=True)
        except Exception as e:
            return StepResult(success=False, message=str(e))

    def validate(self, page, context, shared_state) -> bool:
        try:
            visibility = context.task.visibility.upper() if context.task.visibility else "PRIVATE"
            vis_radio = LocatorResolver.resolve(page, [
                {"type": "css", "selector": f'tp-yt-paper-radio-button[name="{visibility}"]'},
            ])
            return vis_radio.get_attribute("aria-selected") == "true"
        except Exception:
            return False
