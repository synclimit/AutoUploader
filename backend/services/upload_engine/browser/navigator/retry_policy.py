from dataclasses import dataclass

@dataclass
class RetryPolicy:
    max_attempts: int = 3
    delay_seconds: float = 2.0
