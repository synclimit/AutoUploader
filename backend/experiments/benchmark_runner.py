import random
from experiments.models import BenchmarkSnapshot

class BenchmarkRunner:
    def run(self, sandbox_id: str, dataset_name: str) -> BenchmarkSnapshot:
        # Mocking a run through a 100-keyword golden dataset
        total_samples = 100
        fail_count = random.randint(0, 5)
        warning_count = random.randint(0, 10)
        pass_count = total_samples - fail_count - warning_count
        
        return BenchmarkSnapshot(
            dataset_name=dataset_name,
            total_samples=total_samples,
            pass_count=pass_count,
            fail_count=fail_count,
            warning_count=warning_count,
            average_latency_ms=random.randint(1200, 1800)
        )
