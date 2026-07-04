import os
import json
import time

class EvidenceCollector:
    def __init__(self, base_evidence_dir: str, execution_id: str):
        self.evidence_dir = os.path.join(base_evidence_dir, execution_id)
        self.screenshots_dir = os.path.join(self.evidence_dir, "screenshots")
        self.trace_dir = os.path.join(self.evidence_dir, "trace")
        self.video_dir = os.path.join(self.evidence_dir, "video")
        self.logs_dir = os.path.join(self.evidence_dir, "logs")
        
        self.timeline = []

        self._ensure_dirs()

    def _ensure_dirs(self):
        for d in [self.evidence_dir, self.screenshots_dir, self.trace_dir, self.video_dir, self.logs_dir]:
            os.makedirs(d, exist_ok=True)

    def capture_screenshot(self, page, name: str) -> str:
        """Captures a screenshot and returns the file path."""
        file_path = os.path.join(self.screenshots_dir, name)
        page.screenshot(path=file_path)
        return file_path

    def add_timeline_event(self, step_name: str, duration: float, status: str, error: str = ""):
        self.timeline.append({
            "timestamp": time.time(),
            "step": step_name,
            "duration": duration,
            "status": status,
            "error": error
        })

    def save_timeline(self):
        timeline_path = os.path.join(self.evidence_dir, "timeline.json")
        with open(timeline_path, "w") as f:
            json.dump(self.timeline, f, indent=2)

    def save_workflow(self, workflow_data: dict):
        workflow_path = os.path.join(self.evidence_dir, "workflow.json")
        with open(workflow_path, "w") as f:
            json.dump(workflow_data, f, indent=2)

    def save_upload_result(self, result_dict: dict):
        result_path = os.path.join(self.evidence_dir, "upload_result.json")
        with open(result_path, "w") as f:
            json.dump(result_dict, f, indent=2)

    def generate_report(self, data: dict):
        report_path = os.path.join(self.evidence_dir, "PLAYWRIGHT_RUNTIME_REPORT.md")
        with open(report_path, "w") as f:
            f.write("# Playwright Runtime Report\n\n")
            for k, v in data.items():
                f.write(f"- **{k}**: {v}\n")
            
            f.write("\n## Timeline\n")
            for t in self.timeline:
                f.write(f"- {t['step']} ({t['status']}) - {t['duration']:.2f}s\n")
                if t['error']:
                    f.write(f"  - Error: {t['error']}\n")
