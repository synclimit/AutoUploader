import os
import json
import datetime
import subprocess
from pathlib import Path

class ExperimentWorkflow:
    def __init__(self, experiments_dir: str):
        self.experiments_dir = experiments_dir
        
    def _get_git_commit(self):
        try:
            return subprocess.check_output(['git', 'rev-parse', 'HEAD']).decode('utf-8').strip()
        except Exception:
            return "unknown_commit"
            
    def run_benchmark(self, prompt_name: str, version: str, compiled_prompt: str, fingerprint: str):
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        run_id = datetime.datetime.now().strftime("%H%M%S")
        exp_dir = os.path.join(self.experiments_dir, today, f"{prompt_name}_{run_id}")
        os.makedirs(exp_dir, exist_ok=True)
        
        # Simulate generating results
        git_commit = self._get_git_commit()
        
        experiment_metadata = {
            "prompt": prompt_name,
            "version": version,
            "provider": "Gemini",
            "model": "gemini-3.1-pro",
            "dataset": "music_benchmark",
            "evaluation_profile": "full",
            "created_at": datetime.datetime.utcnow().isoformat(),
            "git_commit": git_commit,
            "prompt_hash": fingerprint,
            "runtime": "3.4s",
            "decision_version": "v1",
            "decision_goal": "maximize_ctr",
            "decision_confidence": 0.95,
            "winner": "Candidate 1",
            "learning_confidence": 0.92,
            "finding_count": 2,
            "finding_categories": ["Strategy/Content Rules", "Strategy/Optimization Goal"],
            "sample_size": 15
        }
        
        # Save snapshot
        with open(os.path.join(exp_dir, "compiled_prompt.txt"), 'w', encoding='utf-8') as f:
            f.write(compiled_prompt)
            
        with open(os.path.join(exp_dir, "experiment.json"), 'w') as f:
            json.dump(experiment_metadata, f, indent=4)
            
        # Simulate benchmark metrics based on dummy weights
        pass_pct = 95
        hallucination = 0
        keyword_coverage = 98
        avg_runtime = 3.4
        
        # Weighted score (example): (pass * 0.5) + (coverage * 0.4) - (hallucination * 10)
        weighted_score = (pass_pct * 0.5) + (keyword_coverage * 0.4) - (hallucination * 10)
        
        benchmark_results = {
            "pass_percentage": pass_pct,
            "hallucination": hallucination,
            "keyword_coverage": keyword_coverage,
            "average_runtime": avg_runtime,
            "json_validity": 100,
            "cta_presence": 100,
            "weighted_score": weighted_score
        }
        
        with open(os.path.join(exp_dir, "benchmark.json"), 'w') as f:
            json.dump(benchmark_results, f, indent=4)
            
        with open(os.path.join(exp_dir, "runtime_results.json"), 'w') as f:
            json.dump({"simulated_output": "Success"}, f, indent=4)
            
        return exp_dir
