import time
import traceback
from typing import List, Dict, Any
from .base_step import BaseStep
from .retry_policy import RetryPolicy
from .evidence_collector import EvidenceCollector
from .step_result import StepResult

class WorkflowEngine:
    def __init__(self, evidence_collector: EvidenceCollector):
        self.evidence = evidence_collector
        self.steps: List[Dict[str, Any]] = []
        self.state: Dict[str, Any] = {}

    def add_step(self, step: BaseStep, retry_policy: RetryPolicy = None):
        if retry_policy is None:
            retry_policy = RetryPolicy()
        self.steps.append({
            "step": step,
            "retry_policy": retry_policy
        })

    def execute(self, page, context: Any) -> StepResult:
        """
        Executes all added steps sequentially. 
        Returns the final StepResult indicating overall success or failure.
        """
        total_retries = 0
        failed_step = None
        error_msg = ""
        
        for step_config in self.steps:
            step: BaseStep = step_config["step"]
            policy: RetryPolicy = step_config["retry_policy"]
            
            step_name = step.name
            self.evidence.capture_screenshot(page, f"{step_name}_before.png")
            
            step_success = False
            attempts = 0
            step_start = time.time()
            last_err = ""
            
            while attempts < policy.max_attempts and not step_success:
                attempts += 1
                try:
                    result = step.execute(page, context, self.state)
                    if result.success and step.validate(page, context, self.state):
                        step_success = True
                    else:
                        last_err = result.message or "Validation failed"
                except Exception as e:
                    last_err = f"Exception: {str(e)}"
                    
                if not step_success and attempts < policy.max_attempts:
                    time.sleep(policy.delay_seconds)
                    
            step_duration = time.time() - step_start
            total_retries += (attempts - 1)
            
            if step_success:
                self.evidence.capture_screenshot(page, f"{step_name}_after.png")
                self.evidence.add_timeline_event(step_name, step_duration, "PASS")
            else:
                self.evidence.capture_screenshot(page, f"{step_name}_failed.png")
                self.evidence.add_timeline_event(step_name, step_duration, "FAIL", last_err)
                failed_step = step_name
                error_msg = last_err
                break

        if failed_step:
            return StepResult(
                success=False,
                message=f"Workflow failed at {failed_step}: {error_msg}",
                retries=total_retries
            )
            
        return StepResult(success=True, retries=total_retries, message="Workflow completed successfully.")
