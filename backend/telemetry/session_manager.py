import uuid
from datetime import datetime

class SessionManager:
    _current_session_id = None
    _current_correlation_id = None

    @classmethod
    def start_session(cls):
        date_str = datetime.now().strftime("%Y%m%d")
        unique_part = str(uuid.uuid4())[:6].upper()
        cls._current_session_id = f"AI-{date_str}-{unique_part}"
        cls._current_correlation_id = str(uuid.uuid4())
        return cls._current_session_id, cls._current_correlation_id

    @classmethod
    def get_session(cls):
        if not cls._current_session_id:
            return cls.start_session()
        return cls._current_session_id, cls._current_correlation_id

    @classmethod
    def set_correlation_id(cls, correlation_id: str):
        cls._current_correlation_id = correlation_id
