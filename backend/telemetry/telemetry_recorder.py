import os
from telemetry.storage.base import StorageAdapter
from telemetry.storage.sqlite_adapter import SQLiteStorageAdapter

class TelemetryRecorder:
    def __init__(self, storage_adapter: StorageAdapter = None):
        if storage_adapter is None:
            # Default to SQLite if not injected
            db_path = os.path.join(os.path.dirname(__file__), "data", "telemetry.db")
            self.storage_adapter = SQLiteStorageAdapter(db_path)
        else:
            self.storage_adapter = storage_adapter

    def handle_event(self, event):
        # The event bus calls this
        event_dict = event.to_dict()
        self.storage_adapter.append_event(event_dict)
