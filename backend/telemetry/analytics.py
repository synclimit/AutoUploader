from telemetry.storage.base import StorageAdapter

class TelemetryAnalytics:
    def __init__(self, storage_adapter: StorageAdapter):
        self.storage = storage_adapter

    def generate_dashboard(self) -> str:
        stats = self.storage.statistics()
        
        output = [
            "--- Telemetry Dashboard ---",
            f"Total Sessions Captured: {stats.get('total_sessions', 0)}",
            f"Total Events Recorded: {stats.get('total_events', 0)}",
            "",
            "Provider Metrics:",
            "  - Gemini: 100% (Mock)",
            "  - Cost: $0.000 (Mock)",
            "",
            "User Behavior:",
            "  - Most Edited Field: Description (Mock)",
            "  - Average Edit: 7% (Mock)",
            "  - Most Selected Candidate: #1 (Mock)",
            "---------------------------"
        ]
        
        return "\n".join(output)
