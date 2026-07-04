import os
import json
import uuid
import time
import datetime
from typing import List
from feedback.feedback_package import FeedbackPackage
from learning.models import LearningContext, LearningReport, LearningFinding
from learning.engines.pattern_engines import UserBehaviorEngine, StrategyPatternEngine
from telemetry.session_manager import SessionManager

class LearningBuilder:
    def __init__(self, registry_dir: str):
        self.registry_dir = registry_dir
        self.engines = [
            UserBehaviorEngine(),
            StrategyPatternEngine()
        ]

    def load_profile(self, category: str, version: str) -> dict:
        profile_path = os.path.join(self.registry_dir, category, version, "learning.json")
        with open(profile_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def analyze(self, session_id: str, packages: List[FeedbackPackage], category: str, version: str) -> LearningContext:
        start_time = time.time()
        rules = self.load_profile(category, version)
        
        findings = []
        for engine in self.engines:
            result = engine.analyze(packages, rules)
            if result.get("status") == "pattern_found":
                
                finding = LearningFinding(
                    finding_id=f"FND-{uuid.uuid4().hex[:6].upper()}",
                    target_layer=result.get("target_layer", "Unknown"),
                    target_component=result.get("target_component", "Unknown"),
                    observation=result.get("observation", ""),
                    frequency=result.get("frequency", 0.0),
                    confidence=result.get("confidence", 0.0),
                    evidence=result.get("evidence", 0),
                    timestamp=datetime.datetime.utcnow().isoformat()
                )
                findings.append(finding)
                
        reports = []
        if findings:
            report = LearningReport(
                report_id=str(uuid.uuid4()),
                profile_version=f"{category}/{version}",
                sample_size=len(packages),
                findings=findings,
                timestamp=datetime.datetime.utcnow().isoformat()
            )
            reports.append(report)
                
        return LearningContext(
            session_id=session_id,
            feedback_packages_count=len(packages),
            profile_version=f"{category}/{version}",
            reports=reports,
            runtime_ms=int((time.time() - start_time) * 1000)
        )
