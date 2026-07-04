import os
import json
from promotion.models import PromotionHistory

class PromotionHistoryLogger:
    def __init__(self, log_file: str):
        self.log_file = log_file

    def record(self, history: PromotionHistory):
        # Write immutable append-only logs for promotions
        pass
