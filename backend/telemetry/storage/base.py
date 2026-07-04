from abc import ABC, abstractmethod
from typing import List, Dict

class StorageAdapter(ABC):
    @abstractmethod
    def append_event(self, event_dict: dict):
        pass
        
    @abstractmethod
    def query_session(self, session_id: str) -> List[dict]:
        pass
        
    @abstractmethod
    def statistics(self) -> Dict:
        pass
