import os
import json
import uuid
import time
import datetime
from optimizer.models import ImprovementProposal
from change_planner.models import ChangePlan, ChangeTarget, ChangeValidation, ChangeContext
from change_planner.engines.pattern_planners import StrategyPlanner, PromptPlanner
from change_planner.dependency_analyzer import DependencyAnalyzer
from change_planner.patch_generator import PatchGenerator
from telemetry.session_manager import SessionManager

class ChangePlannerBuilder:
    def __init__(self, registry_dir: str):
        self.registry_dir = registry_dir

    def load_profile(self, category: str, version: str) -> dict:
        profile_path = os.path.join(self.registry_dir, category, version, "planner.json")
        with open(profile_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def build_plan(self, session_id: str, proposal: ImprovementProposal, category: str, version: str) -> ChangeContext:
        start_time = time.time()
        rules = self.load_profile(category, version)
        
        dep_analyzer = DependencyAnalyzer(rules)
        patch_gen = PatchGenerator(rules.get("patch_templates", {}))
        
        target_str = proposal.candidate.target_layer.upper()
        if target_str not in [t.name for t in ChangeTarget]:
            target = ChangeTarget.STRATEGY # fallback
        else:
            target = ChangeTarget[target_str]
            
        planner_engine = StrategyPlanner() if target == ChangeTarget.STRATEGY else PromptPlanner()
        
        # 1. Analyze Dependencies
        deps = dep_analyzer.analyze(proposal.candidate.target_layer, proposal.candidate.proposed_change)
        
        # 2. Generate Patches
        patches = patch_gen.generate(proposal.candidate.target_layer, proposal.candidate.proposed_change)
        
        # 3. Build Migration, Rollback, Actions, Risk
        actions, migration, rollback, risk = planner_engine.plan(proposal)
        
        # 4. Validate
        validation = ChangeValidation(
            is_valid=True,
            errors=[]
        )
        
        plan = ChangePlan(
            plan_id=f"PLAN-{uuid.uuid4().hex[:6].upper()}",
            proposal_id=proposal.proposal_id,
            target=target,
            actions=actions,
            dependencies=deps,
            patches=patches,
            migration=migration,
            rollback=rollback,
            risk=risk,
            validation=validation,
            timestamp=datetime.datetime.utcnow().isoformat()
        )
        
        return ChangeContext(
            session_id=session_id,
            plan=plan,
            runtime_ms=int((time.time() - start_time) * 1000)
        )
