from abc import ABC, abstractmethod
from typing import Any
from .step_result import StepResult

class BaseStep(ABC):
    """
    Abstract base class for all upload workflow steps.
    """
    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def execute(self, page: Any, context: Any, shared_state: dict) -> StepResult:
        """
        Executes the logic for this step.
        Returns a StepResult indicating success or failure.
        """
        pass

    @abstractmethod
    def validate(self, page: Any, context: Any, shared_state: dict) -> bool:
        """
        Verifies that the step actually achieved its outcome on the page.
        Returns True if successful, False otherwise.
        """
        pass
        
    def rollback(self, page, context: Any) -> bool:
        """Optional rollback logic."""
        return True
