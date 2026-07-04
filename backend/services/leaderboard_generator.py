import os
import json

class LeaderboardGenerator:
    def __init__(self, experiments_dir: str):
        self.experiments_dir = experiments_dir
        
    def generate(self, output_dir: str):
        leaderboard = []
        
        if not os.path.exists(self.experiments_dir):
            return leaderboard
            
        for root, dirs, files in os.walk(self.experiments_dir):
            if "experiment.json" in files and "benchmark.json" in files:
                with open(os.path.join(root, "experiment.json"), 'r') as f:
                    exp = json.load(f)
                with open(os.path.join(root, "benchmark.json"), 'r') as f:
                    bench = json.load(f)
                    
                entry = {
                    "prompt": f"{exp.get('prompt')}_{exp.get('version')}",
                    "pass": bench.get("pass_percentage", 0),
                    "runtime": bench.get("average_runtime", 0),
                    "hallucination": bench.get("hallucination", 0),
                    "keyword_coverage": bench.get("keyword_coverage", 0),
                    "weighted_score": bench.get("weighted_score", 0),
                    "commit": exp.get("git_commit", ""),
                    "hash": exp.get("prompt_hash", "")[:8]
                }
                leaderboard.append(entry)
                
        # Sort by weighted score descending
        leaderboard.sort(key=lambda x: x["weighted_score"], reverse=True)
        
        json_path = os.path.join(output_dir, "prompt_leaderboard.json")
        md_path = os.path.join(output_dir, "PROMPT_LEADERBOARD.md")
        
        with open(json_path, 'w') as f:
            json.dump(leaderboard, f, indent=4)
            
        with open(md_path, 'w') as f:
            f.write("# Prompt Leaderboard\n\n")
            f.write("| Rank | Prompt | Hash | Weighted Score | PASS % | Hallucination | Coverage | Runtime | Commit |\n")
            f.write("|---|---|---|---|---|---|---|---|---|\n")
            for i, entry in enumerate(leaderboard, 1):
                f.write(f"| {i} | {entry['prompt']} | `{entry['hash']}` | {entry['weighted_score']:.1f} | {entry['pass']}% | {entry['hallucination']} | {entry['keyword_coverage']}% | {entry['runtime']}s | `{entry['commit'][:7]}` |\n")
                
        return leaderboard
