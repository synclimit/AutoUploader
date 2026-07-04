class PerformanceEngine:
    @staticmethod
    def collect(upload_status: str, metrics: dict):
        # Normalizes raw metrics into a standardized performance score 0-100
        # For this version, just a basic aggregation if upload_status == 'success'
        if upload_status != 'success':
            return 0.0
        
        # Simplified example scoring
        ctr = metrics.get('ctr', 0.0)
        retention = metrics.get('retention', 0.0)
        
        # Basic heuristic
        score = (ctr * 10) + (retention * 0.5)
        return min(max(score, 0.0), 100.0)
