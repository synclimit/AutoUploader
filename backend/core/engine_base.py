from abc import ABC, abstractmethod

class EngineBase(ABC):
    """
    Base class defining the standard lifecycle for all background engines.
    """

    @abstractmethod
    def start(self):
        """Starts the engine."""
        pass

    @abstractmethod
    def stop(self):
        """Stops the engine."""
        pass

    @abstractmethod
    def restart(self):
        """Restarts the engine."""
        pass

    @abstractmethod
    def status(self) -> dict:
        """Returns the current operational status of the engine."""
        pass

    @abstractmethod
    def health(self) -> dict:
        """Returns detailed health metrics for the engine."""
        pass
