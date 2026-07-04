from experiments.models import BenchmarkSnapshot, RegressionSnapshot

class RegressionEngine:
    def analyze(self, baseline_metrics: dict, sandbox_metrics: BenchmarkSnapshot) -> RegressionSnapshot:
        
        baseline_ar = baseline_metrics.get("acceptance_rate", 0.85)
        sandbox_ar = sandbox_metrics.pass_count / sandbox_metrics.total_samples
        
        baseline_lat = baseline_metrics.get("latency_ms", 1500)
        sandbox_lat = sandbox_metrics.average_latency_ms
        
        improvements = []
        regressions = []
        
        if sandbox_ar > baseline_ar:
            improvements.append(f"Acceptance rate improved by {(sandbox_ar - baseline_ar)*100:.1f}%")
        elif sandbox_ar < baseline_ar:
            regressions.append(f"Acceptance rate degraded by {(baseline_ar - sandbox_ar)*100:.1f}%")
            
        if sandbox_lat < baseline_lat:
            improvements.append(f"Latency improved by {baseline_lat - sandbox_lat}ms")
        elif sandbox_lat > baseline_lat:
            regressions.append(f"Latency degraded by {sandbox_lat - baseline_lat}ms")
            
        return RegressionSnapshot(
            baseline_acceptance_rate=baseline_ar,
            sandbox_acceptance_rate=sandbox_ar,
            baseline_latency_ms=baseline_lat,
            sandbox_latency_ms=sandbox_lat,
            improvements=improvements,
            regressions=regressions
        )
