from ..base_step import BaseStep
from ..step_result import StepResult
from ..locator_resolver import LocatorResolver

class AudienceStep(BaseStep):
    def __init__(self):
        super().__init__("Audience")

    def execute(self, page, context, shared_state) -> StepResult:
        context.logger.info("[AudienceStep] Setting audience...")
        try:
            # Click "No, it's not made for kids"
            radio_btn = LocatorResolver.resolve(page, [
                {"type": "css", "selector": 'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]'},
                {"type": "role", "role": "radio", "name": "No, it's not made for kids"}
            ])
            radio_btn.click()
            return StepResult(success=True)
        except Exception as e:
            return StepResult(success=False, message=str(e))

    def validate(self, page, context, shared_state) -> bool:
        try:
            radio_btn = LocatorResolver.resolve(page, [
                {"type": "css", "selector": 'tp-yt-paper-radio-button[name="VIDEO_MADE_FOR_KIDS_NOT_MFK"]'},
            ])
            is_checked = radio_btn.get_attribute("aria-selected") == "true"
            return is_checked
        except Exception:
            return False
