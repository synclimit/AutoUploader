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
            
            # Click "Show more" to reveal advanced settings like AI Use
            try:
                show_more = LocatorResolver.resolve(page, [
                    {"type": "css", "selector": 'ytcp-button#toggle-button'}
                ], timeout=2000)
                if "more" in show_more.inner_text().lower():
                    show_more.click()
                    page.wait_for_timeout(1000) # Give it time to expand
            except Exception:
                pass
                
            # Handle AI Content Declaration
            ai_use = getattr(context.task, "ai_use", "No")
            if ai_use and str(ai_use).strip().lower() == "yes":
                try:
                    ai_radio = LocatorResolver.resolve(page, [
                        {"type": "css", "selector": 'tp-yt-paper-radio-button[name="ALTERED_CONTENT_YES"]'},
                        {"type": "css", "selector": 'tp-yt-paper-radio-button[name="SYNTHETIC_MEDIA_YES"]'},
                        {"type": "css", "selector": 'tp-yt-paper-radio-button[name="VIDEO_ALTERED_CONTENT_YES"]'},
                        {"type": "text", "text": "Yes", "exact": True}
                    ], timeout=3000)
                    ai_radio.click()
                    context.logger.info("[AudienceStep] AI Content Declaration set to 'Yes'")
                except Exception as e:
                    context.logger.warning(f"[AudienceStep] Failed to set AI Content to 'Yes': {e}")
            
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
