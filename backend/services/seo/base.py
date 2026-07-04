from abc import ABC, abstractmethod

class BaseSEOProvider(ABC):
    @abstractmethod
    def open_studio_mode(self, video_id: str) -> dict:
        """Opens YouTube Studio for the given video_id."""
        pass

    @abstractmethod
    def open_search_mode(self, keyword: str) -> dict:
        """Opens YouTube Search for the given keyword."""
        pass
