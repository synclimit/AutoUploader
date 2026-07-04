import sqlite3
import json
import os
from typing import List, Dict
from telemetry.storage.base import StorageAdapter

class SQLiteStorageAdapter(StorageAdapter):
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_db()
        
    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                CREATE TABLE IF NOT EXISTS events (
                    event_id TEXT PRIMARY KEY,
                    session_id TEXT,
                    correlation_id TEXT,
                    event_type TEXT,
                    timestamp TEXT,
                    category TEXT,
                    runtime_ms INTEGER,
                    metadata TEXT
                )
            ''')
            
    def append_event(self, event_dict: dict):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute('''
                INSERT INTO events (event_id, session_id, correlation_id, event_type, timestamp, category, runtime_ms, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                event_dict["event_id"],
                event_dict["session_id"],
                event_dict["correlation_id"],
                event_dict["event_type"],
                event_dict["timestamp"],
                event_dict["category"],
                event_dict["runtime_ms"],
                json.dumps(event_dict["metadata"])
            ))
            
    def query_session(self, session_id: str) -> List[dict]:
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute('SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC', (session_id,))
            rows = cursor.fetchall()
            
        events = []
        for row in rows:
            events.append({
                "event_id": row["event_id"],
                "session_id": row["session_id"],
                "correlation_id": row["correlation_id"],
                "event_type": row["event_type"],
                "timestamp": row["timestamp"],
                "category": row["category"],
                "runtime_ms": row["runtime_ms"],
                "metadata": json.loads(row["metadata"])
            })
        return events
        
    def statistics(self) -> Dict:
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute('SELECT COUNT(*) as total FROM events')
            total_events = cursor.fetchone()[0]
            
            cursor = conn.execute('SELECT COUNT(DISTINCT session_id) as sessions FROM events')
            total_sessions = cursor.fetchone()[0]
            
        return {
            "total_events": total_events,
            "total_sessions": total_sessions
        }
