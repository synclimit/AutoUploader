from ..base_step import BaseStep
from ..step_result import StepResult
from ..locator_resolver import LocatorResolver

class PlaylistStep(BaseStep):
    def __init__(self):
        super().__init__("Playlist")

    def execute(self, page, context, shared_state) -> StepResult:
        task = context.task
        playlist_name = getattr(task, "playlist_title", None) or getattr(task, "playlist_id", None)
        if not playlist_name:
            context.logger.info("[PlaylistStep] No playlist configured.")
            return StepResult(success=True)

        context.logger.info(f"[PlaylistStep] Setting playlist to {playlist_name}...")
        try:
            # 1. Open the dropdown
            dropdown = LocatorResolver.resolve(page, [
                {"type": "css", "selector": 'ytcp-text-dropdown-trigger[role="button"]'},
                {"type": "text", "text": "Select", "exact": False}
            ])
            dropdown.click()
            
            # 2. Find the playlist checkbox
            # We wait for the popup to open
            page.wait_for_selector('tp-yt-paper-dialog', state="visible", timeout=10000)
            
            playlist_checkbox = LocatorResolver.resolve(page, [
                {"type": "role", "role": "checkbox", "name": playlist_name},
                {"type": "text", "text": playlist_name, "exact": False}
            ])
            
            # Check it if not already checked
            if playlist_checkbox.get_attribute("aria-checked") != "true":
                playlist_checkbox.click()
                
            # 3. Click Done in the dropdown
            done_btn = LocatorResolver.resolve(page, [
                {"type": "css", "selector": 'ytcp-button.done-button'},
                {"type": "role", "role": "button", "name": "Done"}
            ])
            done_btn.click()
            
            return StepResult(success=True)
        except Exception as e:
            return StepResult(success=False, message=str(e))

    def validate(self, page, context, shared_state) -> bool:
        return True
