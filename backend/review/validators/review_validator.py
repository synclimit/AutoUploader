from review.review_context import ReviewContext

class ReviewValidator:
    @staticmethod
    def validate(context: ReviewContext) -> bool:
        if not context.scores:
            print(f"[ReviewValidator WARNING] Candidate {context.candidate_id} has no scores.")
            return False
            
        for engine, score in context.scores.items():
            if not (0 <= score <= 100):
                print(f"[ReviewValidator WARNING] Engine '{engine}' produced invalid score: {score}")
                
        if not (0.0 <= context.confidence <= 1.0):
            print(f"[ReviewValidator WARNING] Invalid confidence: {context.confidence}")
            
        return True
