from ..base_step import BaseStep
from ..step_result import StepResult
from ..locator_resolver import LocatorResolver

class ScheduleStep(BaseStep):
    def __init__(self):
        super().__init__("Schedule")

    def execute(self, page, context, shared_state) -> StepResult:
        task = context.task
        scheduled_at = getattr(task, "scheduled_at", None)
        if not scheduled_at or not hasattr(scheduled_at, "strftime"):
            context.logger.info("[ScheduleStep] No schedule configured.")
            return StepResult(success=True)

        context.logger.info(f"[ScheduleStep] Setting schedule to {scheduled_at}...")
        try:
            # Click Schedule radio button
            schedule_radio = LocatorResolver.resolve(page, [
                {"type": "css", "selector": 'tp-yt-paper-radio-button[name="SCHEDULE"]'},
                {"type": "role", "role": "radio", "name": "Schedule"}
            ])
            schedule_radio.click()
            
            # The date picker and time picker open up.
            # Setting exact date/time via playwright on youtube's custom polymer components can be tricky.
            # Ideally we type the date into the input field.
            
            datepicker = LocatorResolver.resolve(page, [
                {"type": "css", "selector": '#datepicker-trigger input'},
                {"type": "css", "selector": 'ytcp-form-input-container#datepicker input'}
            ])
            datepicker.click()
            page.keyboard.press("Control+A")
            page.keyboard.press("Backspace")
            
            # Convert scheduled_at (datetime object) to youtube's expected string "Jan 1, 2026"
            date_str = scheduled_at.strftime("%b %d, %Y")
            datepicker.type(date_str)
            page.keyboard.press("Enter")
            
            # Time picker
            timepicker = LocatorResolver.resolve(page, [
                {"type": "css", "selector": '#time-of-day-trigger input'},
                {"type": "css", "selector": 'ytcp-form-input-container#time-of-day input'}
            ])
            timepicker.click()
            page.keyboard.press("Control+A")
            page.keyboard.press("Backspace")
            
            time_str = scheduled_at.strftime("%I:%M %p") # e.g. "05:00 PM"
            timepicker.type(time_str)
            page.keyboard.press("Enter")
            
            return StepResult(success=True)
        except Exception as e:
            return StepResult(success=False, message=str(e))

    def validate(self, page, context, shared_state) -> bool:
        return True
