import json
import os
from typing import List, Dict
from telemetry.storage.base import StorageAdapter

class JSONLStorageAdapter(StorageAdapter):
    def __init__(self, filepath: str):
        self.filepath = filepath
        os.makedirs(os.path.dirname(self.filepath), exist_ok=True)
        
    def append_event(self, event_dict: dict):
        with open(self.filepath, 'a', encoding='utf-8') as f:
            f.write(json.dumps(event_dict) + "\n")
            
    def query_session(self, session_id: str) -> List[dict]:
        events = []
        if not os.path.exists(self.filepath):
            return events
            
        with open(self.filepath, 'r', encoding='utf-8') as f:
            for line in f:
                data = json.loads(line)
                if data.get("session_id") == session_id:
                    events.append(data)
        return events
        
    def statistics(self) -> Dict:
        stats = {"total_events": 0, "sessions": set()}
        if os.path.exists(self.filepath):
            with open(self.filepath, 'r', encoding='utf-8') as f:
                for line in f:
                    data = json.loads(line)
                    stats["total_events"] += 1
                    stats["sessions"].add(data.get("session_id"))
        stats["total_sessions"] = len(stats["sessions"])
        del stats["sessions"]
        return stats
