import logging
from typing import Callable, Dict, List, Any

logger = logging.getLogger("events")

class EventBus:
    """
    A lightweight in-process EventBus for decoupling system components.
    Future-proof abstraction that can be migrated to Redis or RabbitMQ later.
    """
    def __init__(self):
        self._subscribers: Dict[str, List[Callable]] = {}

    def subscribe(self, topic: str, callback: Callable[[Any], None]):
        if topic not in self._subscribers:
            self._subscribers[topic] = []
        self._subscribers[topic].append(callback)
        logger.debug(f"[EVENT_BUS] Subscribed to topic: {topic}")

    def unsubscribe(self, topic: str, callback: Callable[[Any], None]):
        if topic in self._subscribers:
            if callback in self._subscribers[topic]:
                self._subscribers[topic].remove(callback)
                logger.debug(f"[EVENT_BUS] Unsubscribed from topic: {topic}")

    def publish(self, topic: str, payload: Any):
        logger.debug(f"[EVENT_BUS] Publishing event to topic: {topic}")
        if topic in self._subscribers:
            for callback in self._subscribers[topic]:
                try:
                    callback(payload)
                except Exception as e:
                    logger.error(f"[EVENT_BUS] Error executing callback for topic {topic}: {e}", exc_info=True)


# Global instance
event_bus = EventBus()

def get_event_bus() -> EventBus:
    return event_bus
