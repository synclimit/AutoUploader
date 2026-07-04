from telemetry.storage.base import StorageAdapter

class ReplayEngine:
    def __init__(self, storage_adapter: StorageAdapter):
        self.storage = storage_adapter

    def replay(self, session_id: str):
        events = self.storage.query_session(session_id)
        if not events:
            return f"No events found for session: {session_id}"
            
        output = [f"Replay Timeline for Session {session_id}"]
        output.append("-" * 40)
        
        for e in events:
            # Format: 10:32:11 - GenerationStarted
            time_str = e['timestamp'].split('T')[1][:8] if 'T' in e['timestamp'] else e['timestamp']
            output.append(f"{time_str} - {e['event_type']}")
            
        output.append("-" * 40)
        output.append("Replay Complete (No AI Used)")
        
        return "\n".join(output)
