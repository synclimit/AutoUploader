import time
from ..base_step import BaseStep
from ..step_result import StepResult
from ..locator_resolver import LocatorResolver

class ProcessingStep(BaseStep):
    def __init__(self):
        super().__init__("Processing")

    def execute(self, page, context, shared_state) -> StepResult:
        context.logger.info("[ProcessingStep] Waiting for upload and processing to reach acceptable state...")
        
        # We need to wait for the progress label to indicate upload is done.
        # Acceptable states: "Checks complete", "Upload complete", "Processing up to HD", "Processing will begin shortly"
        # Not acceptable: "Uploading", "0% uploaded"
        
        try:
            # The progress label is at the bottom of the dialog
            # It usually has the class 'progress-label' or 'status-text'
            
            # Since YouTube changes this, we just poll the text content of the dialog footer or the specific status area
            # We wait a maximum of 30 minutes for large videos, but we loop here so we can timeout if needed.
            max_wait_seconds = 1800
            start_time = time.time()
            
            while time.time() - start_time < max_wait_seconds:
                try:
                    # Look for the exact text that confirms upload is done. 
                    # If we find "Upload complete", "Checks complete", "Processing" (but not Uploading), we are good to go.
                    # 'Processing HD' or 'Processing will begin shortly' are also fine.
                    
                    # Alternatively, just look at the bottom status text
                    status_elem = page.locator('span.ytcp-video-info').first # This often holds the status, or a div nearby
                    # A more robust way is to check the entire dialog text for 'Uploading X%' 
                    # If 'Uploading' is in the text, we wait.
                    
                    dialog_text = page.locator('ytcp-uploads-dialog').inner_text()
                    dialog_text_lower = dialog_text.lower()
                    
                    if "uploading" in dialog_text_lower and "uploading " in dialog_text_lower:
                        # still uploading
                        time.sleep(5)
                        continue
                        
                    # If it's not uploading, it's either uploaded, processing, or complete!
                    if "upload complete" in dialog_text_lower or "processing" in dialog_text_lower or "checks complete" in dialog_text_lower:
                        return StepResult(success=True, message="Upload completed, moved to processing/checks.")
                        
                    # Sometimes it says "Saved as draft"
                    if "saved as draft" in dialog_text_lower:
                        time.sleep(5)
                        continue
                        
                except Exception:
                    pass
                    
                time.sleep(5)
                
            return StepResult(success=False, message="Timeout waiting for processing to complete.")
            
        except Exception as e:
            return StepResult(success=False, message=str(e))

    def validate(self, page, context, shared_state) -> bool:
        return True
