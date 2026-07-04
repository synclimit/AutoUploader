import time

class EngineProvider:
    @staticmethod
    def get_engine(engine_state: dict) -> dict:
        return {
            "status": engine_state.get("status", "operational"),
            "uptime": engine_state.get("uptime", "0h 0m"),
            "worker_count": engine_state.get("worker_count", 1),
            "queue_size": engine_state.get("queue_size", 0),
            "active_uploads": engine_state.get("active_uploads", 0),
            "scheduler_status": engine_state.get("scheduler_status", "active"),
            "watch_folder_status": engine_state.get("watch_folder_status", "active"),
            "last_poll": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
