import logging

class EventBus:
    _subscribers = []

    @classmethod
    def subscribe(cls, subscriber):
        if subscriber not in cls._subscribers:
            cls._subscribers.append(subscriber)

    @classmethod
    def publish(cls, event):
        for sub in cls._subscribers:
            try:
                sub.handle_event(event)
            except Exception as e:
                logging.error(f"Error handling event {event.event_type} in {sub}: {e}")
