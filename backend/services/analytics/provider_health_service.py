import time
from typing import Dict, Any
from .analytics_event_bus import event_bus

class ProviderHealthService:
    def __init__(self):
        self.health_records: Dict[str, Dict[str, Any]] = {}
        
    def _init_provider(self, provider_name: str):
        if provider_name not in self.health_records:
            self.health_records[provider_name] = {
                "last_success": None,
                "last_failure": None,
                "consecutive_failures": 0,
                "success_count": 0,
                "failure_count": 0,
                "total_response_time_ms": 0,
                "status": "Healthy"
            }
            
    def record_success(self, provider_name: str, response_time_ms: float):
        self._init_provider(provider_name)
        record = self.health_records[provider_name]
        record["last_success"] = time.time()
        record["consecutive_failures"] = 0
        record["success_count"] += 1
        record["total_response_time_ms"] += response_time_ms
        
        if record["status"] != "Healthy":
            record["status"] = "Healthy"
            # async publish
            import asyncio
            asyncio.create_task(event_bus.publish("ProviderHealthChanged", {"provider": provider_name, "status": "Healthy"}))

    def record_failure(self, provider_name: str):
        self._init_provider(provider_name)
        record = self.health_records[provider_name]
        record["last_failure"] = time.time()
        record["consecutive_failures"] += 1
        record["failure_count"] += 1
        
        new_status = "Degraded" if record["consecutive_failures"] < 3 else "Offline"
        if record["status"] != new_status:
            record["status"] = new_status
            import asyncio
            asyncio.create_task(event_bus.publish("ProviderHealthChanged", {"provider": provider_name, "status": new_status}))

    def get_retry_delay(self, provider_name: str) -> int:
        """
        Exponential backoff: 3s, 10s, 30s. Then cap at 30s.
        """
        self._init_provider(provider_name)
        failures = self.health_records[provider_name]["consecutive_failures"]
        
        if failures <= 1:
            return 3
        elif failures == 2:
            return 10
        else:
            return 30
            
    def get_health(self, provider_name: str) -> Dict[str, Any]:
        self._init_provider(provider_name)
        return self.health_records[provider_name]

provider_health_service = ProviderHealthService()
