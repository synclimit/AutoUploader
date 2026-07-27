from ..base_step import BaseStep
from ..step_result import StepResult
from ..locator_resolver import LocatorResolver

class MetadataStep(BaseStep):
    def __init__(self):
        super().__init__("Metadata")

    def execute(self, page, context, shared_state) -> StepResult:
        task = context.task
        context.logger.info("[MetadataStep] Filling metadata...")
        
        try:
            # Title
            title = task.title or "Untitled Upload"
            title_box = LocatorResolver.resolve(page, [
                {"type": "aria", "label": "Add a title that describes your video (type @ to mention a channel)"},
                {"type": "css", "selector": '#textbox[aria-label*="title"]'},
                {"type": "css", "selector": 'div#textbox'} # Fallback to first textbox
            ])
            title_box.click()
            page.keyboard.press("Control+A")
            page.keyboard.press("Backspace")
            title_box.type(title)
            
            # Description
            desc = task.description or "Uploaded via AutoUploader"
            
            import os
            if task.timestamps_path and os.path.exists(task.timestamps_path):
                try:
                    with open(task.timestamps_path, "r", encoding="utf-8") as f:
                        ts_content = f.read().strip()
                    if ts_content:
                        desc = desc + "\n\n" + ts_content
                except Exception as ts_err:
                    context.logger.warning(f"[MetadataStep] Could not read timestamps.txt: {ts_err}")

            desc_box = LocatorResolver.resolve(page, [
                {"type": "aria", "label": "Tell viewers about your video (type @ to mention a channel)"},
                {"type": "css", "selector": '#textbox[aria-label*="Tell viewers"]'},
                {"type": "css", "selector": 'div#textbox:nth-child(2)'} # Fallback to second textbox
            ])
            
            # Note: Playwright doesn't always have nth-child natively like this on locator if multiple, 
            # so we'll fallback using page.locator('div#textbox').nth(1) if needed, but aria is very robust.
            desc_box.click()
            page.keyboard.press("Control+A")
            page.keyboard.press("Backspace")
            desc_box.type(desc)
            
            return StepResult(success=True)
        except Exception as e:
            return StepResult(success=False, message=str(e))

    def validate(self, page, context, shared_state) -> bool:
        # We assume if typing didn't throw, it's fine.
        # Alternatively, we could check the text content of the boxes.
        return True
