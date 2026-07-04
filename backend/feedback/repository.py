from typing import List
from feedback.feedback_package import FeedbackPackage

class FeedbackRepository:
    def __init__(self, db_session):
        self.db_session = db_session
        
    def fetch_recent_packages(self, limit: int = 100) -> List[FeedbackPackage]:
        # In a real implementation this would fetch from the SQLite DB.
        # For the runtime proof, we can just inject mock packages that follow the exact schema.
        pass
