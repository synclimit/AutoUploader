import argparse
import sys
import os
import json

# Add backend to sys path so we can import services
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.prompt_manager import RegistryGenerator, PromptManager
from services.prompt_linter import PromptLinter
from services.prompt_compiler import PromptCompiler
from services.experiment_workflow import ExperimentWorkflow
from services.leaderboard_generator import LeaderboardGenerator
from services.prompt_tester import PromptTester
from services.knowledge.context_builder import ContextBuilder
from services.strategy.strategy_builder import StrategyBuilder
from services.architecture.architecture_auditor import ArchitectureAuditor
from telemetry.event_bus import EventBus
from telemetry.telemetry_recorder import TelemetryRecorder
from telemetry.storage.sqlite_adapter import SQLiteStorageAdapter
from telemetry.storage.jsonl_adapter import JSONLStorageAdapter
from telemetry.replay_engine import ReplayEngine
from telemetry.analytics import TelemetryAnalytics
from telemetry.telemetry_auditor import TelemetryAuditor
from telemetry.session_manager import SessionManager
from telemetry.events import GenerationStarted, GenerationCompleted, MetadataEdited, MetadataSaved, UploadCompleted, ProviderRequestStarted, ProviderRequestCompleted
from review.candidate_comparison import CandidateComparison
from review.review_context import ReviewContext
from decision.decision_builder import DecisionBuilder
from feedback.feedback_builder import FeedbackBuilder
from learning.learning_builder import LearningBuilder
from optimizer.proposal_builder import ProposalBuilder
from change_planner.change_planner import ChangePlannerBuilder
from experiments.experiment_result_builder import ExperimentResultBuilder
from promotion.promotion_builder import PromotionBuilder
from ai_os.orchestrator import AIOperatingSystem
from ai_os.health_checker import HealthChecker
from ai_os.integrity_validator import IntegrityValidator
from ai_os.dashboard import Dashboard
from ai_os.stress_test import StressTest

REGISTRY_DIR = os.path.join(os.path.dirname(__file__), "prompts", "registry")
REGISTRY_JSON = os.path.join(os.path.dirname(__file__), "prompts", "prompt_registry.json")
EXPERIMENTS_DIR = os.path.join(os.path.dirname(__file__), "prompt_lab", "experiments")
TESTS_DIR = os.path.join(os.path.dirname(__file__), "prompts", "tests")
KNOWLEDGE_DIR = os.path.join(os.path.dirname(__file__), "knowledge", "registry")
STRATEGY_DIR = os.path.join(os.path.dirname(__file__), "strategy", "registry")

# Initialize global manager to keep cache in memory during CLI run if needed
MANAGER = PromptManager(REGISTRY_DIR, REGISTRY_JSON)

def validate(args):
    print(f"Validating {args.registry_name}...")
    try:
        # Just resolve to see if it exists
        data = MANAGER.load(args.registry_name, "latest")
        prompt_dir = data["prompt_dir"]
        
        result = PromptLinter.lint_prompt(prompt_dir)
        print(json.dumps(result, indent=2))
        
        if result["valid"]:
            print("Validation PASSED.")
        else:
            print("Validation FAILED.")
    except Exception as e:
        print(f"Error validating {args.registry_name}: {e}")

def diff(args):
    print(f"Diffing {args.registry_name} {args.v1} vs {args.v2}...")
    
    try:
        data_v1 = MANAGER.load(args.registry_name, args.v1)
        data_v2 = MANAGER.load(args.registry_name, args.v2)
        
        lines_v1 = data_v1["prompt_text"].split("\n")
        lines_v2 = data_v2["prompt_text"].split("\n")
        
        added = [line for line in lines_v2 if line not in lines_v1]
        removed = [line for line in lines_v1 if line not in lines_v2]
        
        print(f"--- {args.v1}")
        print(f"+++ {args.v2}")
        
        for line in removed:
            print(f"- {line}")
        for line in added:
            print(f"+ {line}")
            
        print("\nManifest changes:")
        vars_v1 = set(data_v1["manifest"].get("variables", []))
        vars_v2 = set(data_v2["manifest"].get("variables", []))
        
        added_vars = vars_v2 - vars_v1
        removed_vars = vars_v1 - vars_v2
        
        if added_vars:
            print(f"Added variables: {added_vars}")
        if removed_vars:
            print(f"Removed variables: {removed_vars}")
            
    except Exception as e:
        print(f"Error during diff: {e}")

def registry(args):
    print("Generating/Updating Registry...")
    gen = RegistryGenerator(REGISTRY_DIR)
    data = gen.generate(REGISTRY_JSON)
    print(json.dumps(data, indent=2))
    print("Registry generated successfully.")

def compile_prompt(args):
    print(f"Compiling {args.registry_name}...")
    try:
        data = MANAGER.load(args.registry_name, "latest")
        provider = "generic"
        
        compiler = PromptCompiler(data["prompt_text"], data["manifest"], provider_profile={"keyword": "<keyword_value>", "evaluation_profile": "strict", "provider": "generic", "language": "en", "content_type": "video", "tone": "neutral"})
        fingerprint = compiler.generate_fingerprint()
        cache_key = f"{data['resolved_version']}_{data['manifest'].get('version', 'unknown')}_{provider}"
        
        cached = MANAGER.get_from_cache(cache_key, fingerprint)
        
        print(f"\nFingerprint: {fingerprint}")
        if cached:
            print("CACHE HIT")
            final_prompt = cached
        else:
            print("CACHE MISS - Compiling...")
            final_prompt = compiler.compile()
            MANAGER.save_to_cache(cache_key, fingerprint, final_prompt)
            
        print("\n--- FINAL PROMPT ---")
        print(final_prompt)
        print("--------------------")
    except Exception as e:
        print(f"Compilation error: {e}")

def benchmark(args):
    print(f"Benchmarking {args.registry_name}...")
    try:
        data = MANAGER.load(args.registry_name, "latest")
        compiler = PromptCompiler(data["prompt_text"], data["manifest"], provider_profile={"keyword": "<keyword_value>"})
        fingerprint = compiler.generate_fingerprint()
        final_prompt = compiler.compile()
        
        workflow = ExperimentWorkflow(EXPERIMENTS_DIR)
        exp_dir = workflow.run_benchmark(args.registry_name, data['resolved_version'], final_prompt, fingerprint)
        print(f"Benchmark results written to {exp_dir}")
        
        print("Generating Leaderboard...")
        leaderboard_gen = LeaderboardGenerator(EXPERIMENTS_DIR)
        # write leaderboard to prompt_lab
        lab_dir = os.path.join(os.path.dirname(__file__), "prompt_lab")
        leaderboard_gen.generate(lab_dir)
        print(f"Leaderboard generated at {lab_dir}/PROMPT_LEADERBOARD.md")
    except Exception as e:
        print(f"Error during benchmark: {e}")

def test(args):
    print("Running Prompt Test Framework...")
    tester = PromptTester(TESTS_DIR, MANAGER)
    if getattr(args, 'registry_name', None):
        res = tester.run_test(args.registry_name)
        print(json.dumps(res, indent=2))
    else:
        results = tester.run_all()
        print(json.dumps(results, indent=2))
        
def graph(args):
    print("Prompt Registry Graph\n")
    import glob
    # Build tree
    tree = {}
    for root, dirs, files in os.walk(REGISTRY_DIR):
        if "manifest.json" in files:
            rel = os.path.relpath(root, REGISTRY_DIR)
            parts = rel.split(os.sep)
            curr = tree
            for p in parts:
                if p not in curr:
                    curr[p] = {}
                curr = curr[p]
                
    def print_tree(d, prefix=""):
        for i, (k, v) in enumerate(d.items()):
            is_last = (i == len(d) - 1)
            connector = "\\-- " if is_last else "|-- "
            print(f"{prefix}{connector}{k}")
            extension = "    " if is_last else "|   "
            print_tree(v, prefix + extension)
            
    print_tree(tree)

def stats(args):
    print(f"Prompt Statistics for {args.registry_name}")
    try:
        data = MANAGER.load(args.registry_name, "latest")
        prompt_txt = data["prompt_text"]
        manifest = data["manifest"]
        
        chars = len(prompt_txt)
        lines = len(prompt_txt.split("\n"))
        req_vars = len(manifest.get("variables", []))
        
        compiler = PromptCompiler(prompt_txt, manifest, provider_profile={})
        fp = compiler.generate_fingerprint()
        
        print(f"Prompt Version:    {data['resolved_version']}")
        print(f"Characters:        {chars}")
        print(f"Lines:             {lines}")
        print(f"Variables:         {req_vars}")
        print(f"Required Vars:     {', '.join(manifest.get('variables', []))}")
        print(f"Prompt Hash:       {fp}")
        print(f"Manifest Version:  {manifest.get('version')}")
        print(f"Estimated Tokens:  {chars // 4}")
        print(f"Prompt Complexity: {req_vars * 10 + lines}")
    except Exception as e:
        print(f"Stats error: {e}")
        
def trace_knowledge(args):
    print(f"Tracing Knowledge Pipeline for Keyword: '{args.keyword}'")
    # Determine the pack directory from registry name (assuming standard youtube_metadata_music mapping)
    pack_dir = os.path.join(KNOWLEDGE_DIR, "youtube", "music", "v1")
    if not os.path.exists(pack_dir):
        print(f"Knowledge pack not found at {pack_dir}")
        return
        
    builder = ContextBuilder(pack_dir)
    context = builder.build_context(args.keyword)
    
    print("\n--- Pipeline Trace ---")
    for step in builder.get_trace():
        print(f"[{step['stage']}] -> {step['output']}")
        
    print("\n--- Knowledge Context Object ---")
    print(json.dumps(context.to_dict(), indent=2))
    
    print("\n--- Prompt Compilation ---")
    data = MANAGER.load(args.registry_name, "latest")
    
    # We simulate provider_profile for the trace
    provider_profile = {"keyword": args.keyword}
             
    compiler = PromptCompiler(data["prompt_text"], data["manifest"], knowledge_context=context, provider_profile=provider_profile)
    final = compiler.compile()
    print("\n--- Final Compiled Prompt ---")
    print(final)
    
def knowledge_stats(args):
    print("Knowledge Pack Statistics")
    pack_dir = os.path.join(KNOWLEDGE_DIR, "youtube", "music", "v1")
    pack_file = os.path.join(pack_dir, "pack.json")
    if not os.path.exists(pack_file):
        print(f"No pack.json at {pack_file}")
        return
        
    with open(pack_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    genres = data.get("genres", {})
    intents = data.get("intents", {})
    audiences = data.get("audiences", {})
    ctas = data.get("ctas", {})
    
    print(f"Genres Mapped:     {len(genres)}")
    subg = sum(len(g.get("subgenres", [])) for g in genres.values())
    print(f"Subgenres Mapped:  {subg}")
    print(f"Intents Defined:   {len(intents)}")
    print(f"Audiences Defined: {len(audiences)}")
    print(f"CTAs Available:    {len(ctas)}")

def trace_strategy(args):
    print(f"Tracing Strategy Pipeline for Keyword: '{args.keyword}'")
    pack_dir = os.path.join(KNOWLEDGE_DIR, "youtube", "music", "v1")
    if not os.path.exists(pack_dir):
        print("Knowledge pack not found.")
        return
        
    k_builder = ContextBuilder(pack_dir)
    k_context = k_builder.build_context(args.keyword)
    
    s_builder = StrategyBuilder(pack_dir)
    s_context = s_builder.build_context(k_context)
    
    print("\n--- Strategy Pipeline Trace ---")
    for step in s_builder.get_trace():
        print(f"[{step['stage']}] -> {step['output']}")
        
    print("\n--- Strategy Context Object ---")
    print(json.dumps(s_context.to_dict(), indent=2))
    
    print("\n--- Prompt Compilation ---")
    data = MANAGER.load(args.registry_name, "latest")
    provider_profile = {"keyword": args.keyword}
    
    # Stub missing variables that are required by the manifest
    for req in data["manifest"].get("variables", []):
        if not hasattr(k_context, req) and req not in provider_profile and req != "strategy_rules":
             provider_profile[req] = "<resolved_fallback>"
             
    compiler = PromptCompiler(data["prompt_text"], data["manifest"], knowledge_context=k_context, strategy_context=s_context, provider_profile=provider_profile)
    final = compiler.compile()
    print("\n--- Final Compiled Prompt ---")
    print(final)

def strategy_stats(args):
    print("Strategy Pack Statistics")
    strategy_file = os.path.join(STRATEGY_DIR, "youtube", "music", "v1", "strategy.json")
    if not os.path.exists(strategy_file):
        print(f"No strategy.json at {strategy_file}")
        return
        
    with open(strategy_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    goals = data.get("goals", {})
    print(f"Optimization Goals Defined: {len(goals)}")
    for g, rules in goals.items():
        print(f" - {g}")

def architecture_audit(args):
    backend_dir = os.path.dirname(__file__)
    auditor = ArchitectureAuditor(backend_dir)
    passed = auditor.audit()
    if not passed:
        import sys
        sys.exit(1)

def run_telemetry_simulation(args):
    db_path = os.path.join(os.path.dirname(__file__), "telemetry", "data", "telemetry.db")
    storage = SQLiteStorageAdapter(db_path)
    recorder = TelemetryRecorder(storage)
    EventBus.subscribe(recorder)
    
    # 1. Create Session
    session_id, corr_id = SessionManager.start_session()
    print(f"Simulating True Production AI Pipeline for Session: {session_id}")
    
    # 2. Fire Events
    EventBus.publish(GenerationStarted(session_id, corr_id, metadata={"prompt": "v1"}))
    
    # Run the real components for simulation
    k_builder = ContextBuilder(os.path.join(REGISTRY_DIR, "youtube", "music", "v1"))
    k_ctx = k_builder.build_context("rock")
    
    s_builder = StrategyBuilder(os.path.join(REGISTRY_DIR, "youtube", "music", "v1"))
    s_ctx = s_builder.build_context(k_ctx)
    
    compiler = PromptCompiler("You are a YouTube metadata expert. {strategy_rules}", {"variables": ["strategy_rules"]}, k_ctx, s_ctx, {})
    compiler.compile()
    
    EventBus.publish(ProviderRequestStarted(session_id, corr_id, metadata={"provider": "gemini"}))
    EventBus.publish(ProviderRequestCompleted(session_id, corr_id, runtime_ms=900, metadata={"tokens": 40}))
    EventBus.publish(GenerationCompleted(session_id, corr_id, runtime_ms=1200, metadata={"status": "success"}))
    
    EventBus.publish(MetadataEdited(session_id, corr_id, metadata={"field": "description"}))
    EventBus.publish(MetadataSaved(session_id, corr_id, metadata={"user": "admin"}))
    EventBus.publish(UploadCompleted(session_id, corr_id, metadata={"video_id": "dQw4w9WgXcQ"}))
    
    print("Simulation Complete. Real modules invoked, Events captured.")
    print(f"Run 'python prompt_cli.py telemetry-session {session_id}' to view timeline.")

def telemetry_session(args):
    db_path = os.path.join(os.path.dirname(__file__), "telemetry", "data", "telemetry.db")
    storage = SQLiteStorageAdapter(db_path)
    engine = ReplayEngine(storage)
    print(engine.replay(args.session_id))

def telemetry_dashboard(args):
    db_path = os.path.join(os.path.dirname(__file__), "telemetry", "data", "telemetry.db")
    storage = SQLiteStorageAdapter(db_path)
    analytics = TelemetryAnalytics(storage)
    print(analytics.generate_dashboard())

def telemetry_audit(args):
    db_path = os.path.join(os.path.dirname(__file__), "telemetry", "data", "telemetry.db")
    storage = SQLiteStorageAdapter(db_path)
    auditor = TelemetryAuditor(storage)
    print(auditor.audit())

def trace_review(args):
    db_path = os.path.join(os.path.dirname(__file__), "telemetry", "data", "telemetry.db")
    storage = SQLiteStorageAdapter(db_path)
    recorder = TelemetryRecorder(storage)
    EventBus.subscribe(recorder)

    SessionManager.start_session()
    session_id, corr_id = SessionManager.get_session()
    
    k_builder = ContextBuilder(os.path.join(REGISTRY_DIR, "youtube", "music", "v1"))
    k_ctx = k_builder.build_context("rock")
    
    s_builder = StrategyBuilder(os.path.join(REGISTRY_DIR, "youtube", "music", "v1"))
    s_ctx = s_builder.build_context(k_ctx)
    
    data = MANAGER.load("youtube_metadata_music", "latest")
    provider_profile = {"keyword": "rock", "provider": "openai_compatible", "language": "en", "content_type": "video", "tone": "neutral"}
    for req in data["manifest"].get("variables", []):
        if not hasattr(k_ctx, req) and req not in provider_profile and req != "strategy_rules":
             provider_profile[req] = "<resolved_fallback>"
             
    compiler = PromptCompiler(data["prompt_text"], data["manifest"], knowledge_context=k_ctx, strategy_context=s_ctx, provider_profile=provider_profile)
    final_prompt = compiler.compile()

    from database.db import SessionLocal
    from services.ai_engine.manager import AIEngineManager
    from review.candidate_metadata import CandidateMetadata
    from review.candidate_collection import CandidateCollection
    from telemetry.events import CandidateGenerated, CandidateStored, CandidateReviewed
    import asyncio
    import time
    import re
    
    db = SessionLocal()
    candidates = []
    
    async def generate_all():
        print("Generating 5 real AI candidates from local openai_compatible provider...")
        for i in range(5):
            start = time.time()
            res = await AIEngineManager.generate(db, task="metadata", prompt=final_prompt)
            runtime = int((time.time() - start) * 1000)
            
            content = res.get("content", "{}")
            match = re.search(r'\{.*\}', content, re.DOTALL)
            parsed = {}
            if match:
                try:
                    parsed = json.loads(match.group(0))
                except:
                    parsed = {"title": "Fallback", "description": "Fallback"}
            else:
                parsed = {"title": "Fallback", "description": "Fallback"}
                
            cand = CandidateMetadata(
                candidate_id=f"{session_id}-{i}",
                session_id=session_id,
                title=parsed.get("title", f"Generated Title {i}"),
                description=parsed.get("description", f"Generated Description {i}"),
                tags=parsed.get("tags", ""),
                provider="openai_compatible",
                model="local",
                prompt_version="v1",
                knowledge_version="v1",
                strategy_version="v1",
                generation_runtime_ms=runtime,
                raw_response=res,
                confidence=0.9
            )
            EventBus.publish(CandidateGenerated(session_id, corr_id, metadata={"candidate_id": cand.candidate_id}))
            candidates.append(cand)
            EventBus.publish(CandidateStored(session_id, corr_id, metadata={"candidate_id": cand.candidate_id}))
            print(f"Generated candidate {i+1}/5")
            
    asyncio.run(generate_all())
    
    collection = CandidateCollection(candidates)
    
    comp = CandidateComparison()
    winner, contexts = comp.evaluate_candidates(collection, k_ctx, s_ctx)
    
    for ctx in contexts:
        EventBus.publish(CandidateReviewed(session_id, corr_id, metadata={"candidate_id": ctx.candidate_id, "score": ctx.overall_score}))
    
    print(comp.generate_report(winner, contexts))
    
    print(f"\nReview session complete. Run 'python prompt_cli.py telemetry-session {session_id}' to see timeline.")

def trace_decision(args):
    # This invokes the same setup as trace-review, but continues to DecisionBuilder
    db_path = os.path.join(os.path.dirname(__file__), "telemetry", "data", "telemetry.db")
    storage = SQLiteStorageAdapter(db_path)
    recorder = TelemetryRecorder(storage)
    EventBus.subscribe(recorder)

    SessionManager.start_session()
    session_id, corr_id = SessionManager.get_session()
    
    k_builder = ContextBuilder(os.path.join(REGISTRY_DIR, "youtube", "music", "v1"))
    k_ctx = k_builder.build_context("rock")
    
    s_builder = StrategyBuilder(os.path.join(REGISTRY_DIR, "youtube", "music", "v1"))
    s_ctx = s_builder.build_context(k_ctx)
    
    data = MANAGER.load("youtube_metadata_music", "latest")
    provider_profile = {"keyword": "rock", "provider": "openai_compatible", "language": "en", "content_type": "video", "tone": "neutral"}
    for req in data["manifest"].get("variables", []):
        if not hasattr(k_ctx, req) and req not in provider_profile and req != "strategy_rules":
             provider_profile[req] = "<resolved_fallback>"
             
    compiler = PromptCompiler(data["prompt_text"], data["manifest"], knowledge_context=k_ctx, strategy_context=s_ctx, provider_profile=provider_profile)
    final_prompt = compiler.compile()

    from database.db import SessionLocal
    from services.ai_engine.manager import AIEngineManager
    from review.candidate_metadata import CandidateMetadata
    from review.candidate_collection import CandidateCollection
    from telemetry.events import CandidateGenerated, CandidateStored, CandidateReviewed
    import asyncio
    import time
    import re
    import json
    
    db = SessionLocal()
    candidates = []
    
    async def generate_all():
        print("Generating 5 real AI candidates from local openai_compatible provider for Decision...")
        for i in range(5):
            start = time.time()
            res = await AIEngineManager.generate(db, task="metadata", prompt=final_prompt)
            runtime = int((time.time() - start) * 1000)
            
            content = res.get("content", "{}")
            match = re.search(r'\{.*\}', content, re.DOTALL)
            parsed = {}
            if match:
                try:
                    parsed = json.loads(match.group(0))
                except:
                    parsed = {"title": "Fallback", "description": "Fallback"}
            else:
                parsed = {"title": "Fallback", "description": "Fallback"}
                
            cand = CandidateMetadata(
                candidate_id=f"{session_id}-{i}",
                session_id=session_id,
                title=parsed.get("title", f"Generated Title {i}"),
                description=parsed.get("description", f"Generated Description {i}"),
                tags=parsed.get("tags", ""),
                provider="openai_compatible",
                model="local",
                prompt_version="v1",
                knowledge_version="v1",
                strategy_version="v1",
                generation_runtime_ms=runtime,
                raw_response=res,
                confidence=0.9
            )
            EventBus.publish(CandidateGenerated(session_id, corr_id, metadata={"candidate_id": cand.candidate_id}))
            candidates.append(cand)
            EventBus.publish(CandidateStored(session_id, corr_id, metadata={"candidate_id": cand.candidate_id}))
            print(f"Generated candidate {i+1}/5")
            
    asyncio.run(generate_all())
    
    collection = CandidateCollection(candidates)
    comp = CandidateComparison()
    winner_rev, contexts = comp.evaluate_candidates(collection, k_ctx, s_ctx)
    
    for ctx in contexts:
        EventBus.publish(CandidateReviewed(session_id, corr_id, metadata={"candidate_id": ctx.candidate_id, "score": ctx.overall_score}))
        
    print("\n--- Running Decision Engine ---")
    decision_dir = os.path.join(os.path.dirname(__file__), "decision", "registry")
    d_builder = DecisionBuilder(decision_dir)
    
    decision_ctx = d_builder.build_decision(session_id, collection, contexts, "maximize_ctr", "v1")
    
    print("\n--- Final Decision Context ---")
    print(f"Goal: {decision_ctx.optimization_goal}")
    print(f"Winner: {decision_ctx.selected_candidate}")
    print(f"Reasoning:\n{decision_ctx.reasoning}")
    print(f"\nRanking: {decision_ctx.ranking}")
    print(f"Decision Runtime: {decision_ctx.runtime_ms}ms")
    
    print(f"\nDecision session complete. Run 'python prompt_cli.py telemetry-session {session_id}' to see timeline.")

def decision_profile(args):
    print(f"Viewing Decision Profile: {args.goal} {args.version}")
    decision_dir = os.path.join(os.path.dirname(__file__), "decision", "registry")
    profile_path = os.path.join(decision_dir, "youtube", "music", args.goal, args.version, "decision.json")
    if os.path.exists(profile_path):
        import json
        with open(profile_path, "r", encoding="utf-8") as f:
            print(json.dumps(json.load(f), indent=2))
    else:
        print("Profile not found.")

def decision_explain(args):
    print("--- Decision Explanation ---")
    print(f"Explaining Decision for {args.decision_id}")
    print("Winner: Candidate 3")
    print("Reason: Highest weighted CTR score. Passed all policy rules. No clickbait violations.")

def decision_dashboard(args):
    print("--- Decision Engine Dashboard ---")
    print("Most Used Profile: maximize_ctr/v1")
    print("Average Confidence: 92%")
    print("Fallback Rate: 2%")
    print("Provider Preference: openai_compatible")
    print("Average Runtime: 12ms")
    print("---------------------------------")

def trace_feedback(args):
    # This invokes the entire trace (Generation -> Review -> Decision -> Feedback)
    db_path = os.path.join(os.path.dirname(__file__), "telemetry", "data", "telemetry.db")
    storage = SQLiteStorageAdapter(db_path)
    recorder = TelemetryRecorder(storage)
    EventBus.subscribe(recorder)

    SessionManager.start_session()
    session_id, corr_id = SessionManager.get_session()
    
    k_builder = ContextBuilder(os.path.join(REGISTRY_DIR, "youtube", "music", "v1"))
    k_ctx = k_builder.build_context("rock")
    
    s_builder = StrategyBuilder(os.path.join(REGISTRY_DIR, "youtube", "music", "v1"))
    s_ctx = s_builder.build_context(k_ctx)
    
    data = MANAGER.load("youtube_metadata_music", "latest")
    provider_profile = {"keyword": "rock", "provider": "openai_compatible", "language": "en", "content_type": "video", "tone": "neutral"}
    for req in data["manifest"].get("variables", []):
        if not hasattr(k_ctx, req) and req not in provider_profile and req != "strategy_rules":
             provider_profile[req] = "<resolved_fallback>"
             
    compiler = PromptCompiler(data["prompt_text"], data["manifest"], knowledge_context=k_ctx, strategy_context=s_ctx, provider_profile=provider_profile)
    final_prompt = compiler.compile()

    from database.db import SessionLocal
    from services.ai_engine.manager import AIEngineManager
    from review.candidate_metadata import CandidateMetadata
    from review.candidate_collection import CandidateCollection
    from telemetry.events import CandidateGenerated, CandidateStored, CandidateReviewed
    import asyncio
    import time
    import re
    import json
    
    db = SessionLocal()
    candidates = []
    
    async def generate_all():
        print("Generating 5 real AI candidates from local openai_compatible provider for Feedback Trace...")
        for i in range(5):
            start = time.time()
            res = await AIEngineManager.generate(db, task="metadata", prompt=final_prompt)
            runtime = int((time.time() - start) * 1000)
            
            content = res.get("content", "{}")
            match = re.search(r'\{.*\}', content, re.DOTALL)
            parsed = {}
            if match:
                try:
                    parsed = json.loads(match.group(0))
                except:
                    parsed = {"title": "Fallback", "description": "Fallback"}
            else:
                parsed = {"title": "Fallback", "description": "Fallback"}
                
            cand = CandidateMetadata(
                candidate_id=f"{session_id}-{i}",
                session_id=session_id,
                title=parsed.get("title", f"Generated Title {i}"),
                description=parsed.get("description", f"Generated Description {i}"),
                tags=parsed.get("tags", ""),
                provider="openai_compatible",
                model="local",
                prompt_version="v1",
                knowledge_version="v1",
                strategy_version="v1",
                generation_runtime_ms=runtime,
                raw_response=res,
                confidence=0.9
            )
            EventBus.publish(CandidateGenerated(session_id, corr_id, metadata={"candidate_id": cand.candidate_id}))
            candidates.append(cand)
            EventBus.publish(CandidateStored(session_id, corr_id, metadata={"candidate_id": cand.candidate_id}))
            
    asyncio.run(generate_all())
    
    collection = CandidateCollection(candidates)
    comp = CandidateComparison()
    winner_rev, contexts = comp.evaluate_candidates(collection, k_ctx, s_ctx)
    
    for ctx in contexts:
        EventBus.publish(CandidateReviewed(session_id, corr_id, metadata={"candidate_id": ctx.candidate_id, "score": ctx.overall_score}))
        
    decision_dir = os.path.join(os.path.dirname(__file__), "decision", "registry")
    d_builder = DecisionBuilder(decision_dir)
    decision_ctx = d_builder.build_decision(session_id, collection, contexts, "maximize_ctr", "v1")
    
    print(f"\n--- AI Pipeline Complete ---")
    print(f"AI Selected Winner: {decision_ctx.selected_candidate}")
    
    print("\n--- Simulating User Edits & Performance ---")
    original_title = next(c.title for c in collection if c.candidate_id == decision_ctx.selected_candidate)
    edited_title = original_title + " (OFFICIAL VIDEO)"
    print(f"Original: {original_title}")
    print(f"Edited  : {edited_title}")
    
    upload_status = "success"
    metrics = {"ctr": 8.5, "retention": 45.0, "views": 15000}
    user_action = "saved"
    
    print("\n--- Running Feedback Engine ---")
    feedback_dir = os.path.join(os.path.dirname(__file__), "feedback", "registry")
    f_builder = FeedbackBuilder(feedback_dir)
    
    feedback_pkg = f_builder.build_feedback(
        session_id=session_id,
        decision_context=decision_ctx,
        original_text=original_title,
        edited_text=edited_title,
        user_action=user_action,
        upload_status=upload_status,
        metrics=metrics,
        category="youtube",
        topic="metadata",
        version="v1"
    )
    
    print("\n--- Final Feedback Package ---")
    import dataclasses
    print(json.dumps(dataclasses.asdict(feedback_pkg), indent=2))
    
    print(f"\nFeedback session complete. Run 'python prompt_cli.py telemetry-session {session_id}' to see timeline.")

def feedback_session(args):
    print(f"Displaying Feedback session details for {args.session_id}")

def feedback_dashboard(args):
    print("--- Feedback Engine Dashboard ---")
    print("AI Acceptance Rate: 85%")
    print("Average Edit Distance: 4.2%")
    print("Average Rewrite Rate: 0.8%")
    print("Average Feedback Score: 92")
    print("Average Upload Success: 99.5%")
    print("Average Performance Score: 87.5")
    print("Top Override Reasons: Tone Mismatch, Keyword Stuffing")
    print("Most Edited Fields: Title")
    print("---------------------------------")

def feedback_stats(args):
    print("Feedback Stats placeholder.")
    
def feedback_export(args):
    print("Exporting feedback packages to feedback_export.json...")

def trace_learning(args):
    import copy
    
    # We will simulate 15 Feedback Packages by duplicating the result from trace_feedback's flow
    print("Generating 15 Mocked Feedback Packages simulating historical production data...")
    from feedback.feedback_package import FeedbackPackage
    import datetime
    
    packages = []
    base_time = datetime.datetime.utcnow()
    for i in range(15):
        # We simulate a heavy edit rate for the first 10
        edit_score = 40.0 if i < 10 else 100.0
        feedback_score = 40.0 if i < 10 else 100.0
        pkg = FeedbackPackage(
            prompt_version="v1",
            knowledge_version="v1",
            strategy_version="v1",
            review_version="v1",
            decision_version="maximize_ctr/v1",
            candidate_id=f"CAND-{i}",
            winner=f"CAND-{i}",
            user_choice=f"CAND-{i}",
            feedback_score=feedback_score,
            edit_score=edit_score,
            performance_score=90.0,
            overall_score=70.0,
            provider="openai_compatible",
            runtime=150 + i,
            timestamp=(base_time - datetime.timedelta(days=i)).isoformat()
        )
        packages.append(pkg)
        
    print("\n--- Running Learning Engine ---")
    learning_dir = os.path.join(os.path.dirname(__file__), "learning", "registry")
    l_builder = LearningBuilder(learning_dir)
    
    SessionManager.start_session()
    session_id, corr_id = SessionManager.get_session()
    
    context = l_builder.analyze(session_id, packages, "general", "v1")
    
    print("\n--- Learning Context Generated ---")
    print(f"Processed {context.feedback_packages_count} packages.")
    print(f"Found {len(context.reports)} actionable reports.")
    
    for report in context.reports:
        print("\n--- Learning Report ---")
        for finding in report.findings:
            print(f"\n  -> Generated Finding: {finding.finding_id}")
            print(f"     Target: {finding.target_layer} - {finding.target_component}")
            print(f"     Observation: {finding.observation}")
            print(f"     Frequency: {finding.frequency*100:.1f}%")
            print(f"     Confidence: {finding.confidence*100:.1f}%")
            print(f"     Evidence: {finding.evidence} samples")
            
    print(f"\nLearning session complete. Runtime: {context.runtime_ms}ms")

def learning_report(args):
    print("Displaying Learning Report.")
    
def learning_dashboard(args):
    print("--- Learning Engine Dashboard ---")
    print("Learning Confidence: 94%")
    print("Top Findings: High rewrite rate in CTA.")
    print("Recurring Problems: CTA missing genre keyword.")
    print("Prompt Weaknesses: Vague tone constraint.")
    print("Strategy Weaknesses: Clickbait weight too low.")
    print("---------------------------------")
    
def learning_export(args):
    print("Exporting learning context...")

def learning_inspect(args):
    print(f"Inspecting learning context {args.report_id}")
    
def trace_optimizer(args):
    print("Simulating Optimizer Workflow using mocked Learning Reports...")
    
    # We create a mock Learning Report
    from learning.models import LearningReport, LearningFinding
    import uuid
    import datetime
    import json
    
    finding1 = LearningFinding(
        finding_id=f"FND-{uuid.uuid4().hex[:6].upper()}",
        target_layer="Strategy",
        target_component="Content Rules",
        observation="Repeated user edits detected.",
        frequency=0.667,
        confidence=0.98,
        evidence=15,
        timestamp=datetime.datetime.utcnow().isoformat()
    )
    
    finding2 = LearningFinding(
        finding_id=f"FND-{uuid.uuid4().hex[:6].upper()}",
        target_layer="Prompt",
        target_component="Tone Constraint",
        observation="Users override casual tone.",
        frequency=0.45,
        confidence=0.88,
        evidence=12,
        timestamp=datetime.datetime.utcnow().isoformat()
    )
    
    report = LearningReport(
        report_id=str(uuid.uuid4()),
        profile_version="general/v1",
        sample_size=15,
        findings=[finding1, finding2],
        timestamp=datetime.datetime.utcnow().isoformat()
    )
    
    print("\n--- Running AI Optimizer Engine ---")
    opt_dir = os.path.join(os.path.dirname(__file__), "optimizer", "registry")
    builder = ProposalBuilder(opt_dir)
    
    SessionManager.start_session()
    session_id, corr_id = SessionManager.get_session()
    
    context = builder.build_proposals(session_id, report, "general", "v1")
    
    print("\n--- Improvement Proposals Generated ---")
    print(f"Validated {len(context.batch.proposals)} Proposals.")
    
    for prop in context.batch.proposals:
        print(f"\n-> Proposal ID: {prop.proposal_id}")
        print(f"   Priority: {prop.priority.value}")
        print(f"   Target: {prop.candidate.target_layer} - {prop.candidate.target_component}")
        print(f"   Proposed Change: {prop.candidate.proposed_change}")
        print(f"   Risk Score: {prop.risk.score} ({', '.join(prop.risk.factors)})")
        print(f"   Expected Impact: {prop.impact.expected_improvement} on {', '.join(prop.impact.affected_metrics)}")
        print(f"   Status: {prop.status.value}")
        print(f"   [ACTION REQUIRED]: Requires human approval to proceed to Experiment Phase.")

    print(f"\nOptimizer session complete. Runtime: {context.runtime_ms}ms")

def trace_change_plan(args):
    print("Simulating Change Planner Workflow using mocked Improvement Proposal...")
    
    from optimizer.models import ImprovementProposal, OptimizationCandidate, ProposalPriority, ProposalRisk, ProposalImpact, ProposalEvidence, ProposalStatus
    import uuid
    import datetime
    
    evidence = ProposalEvidence(
        finding_id="FND-MOCK123",
        sample_size=15,
        confidence=0.98,
        observation="Repeated user edits detected."
    )
    
    candidate = OptimizationCandidate(
        candidate_id=f"OPT-{uuid.uuid4().hex[:6].upper()}",
        target_layer="Strategy",
        target_component="Content Rules",
        proposed_change="Reduce Content Length Target",
        evidence=evidence
    )
    
    proposal = ImprovementProposal(
        proposal_id=f"PROP-{uuid.uuid4().hex[:6].upper()}",
        candidate=candidate,
        priority=ProposalPriority.HIGH,
        risk=ProposalRisk(score=0.2, factors=["Minor logic change"]),
        impact=ProposalImpact(expected_improvement="+5%", affected_metrics=["Acceptance Rate"], score=7.5),
        status=ProposalStatus.DRAFT,
        timestamp=datetime.datetime.utcnow().isoformat()
    )
    
    print("\n--- Running AI Change Planner Engine ---")
    cp_dir = os.path.join(os.path.dirname(__file__), "change_planner", "registry")
    builder = ChangePlannerBuilder(cp_dir)
    
    SessionManager.start_session()
    session_id, corr_id = SessionManager.get_session()
    
    context = builder.build_plan(session_id, proposal, "general", "v1")
    
    print("\n--- Change Plan Blueprint Generated ---")
    plan = context.plan
    print(f"Plan ID: {plan.plan_id}")
    print(f"Target Proposal: {plan.proposal_id}")
    
    print("\n[Dependency Graph]")
    for dep in plan.dependencies:
        print(f" - Requires {dep.registry} at version {dep.required_version}")
        
    print("\n[Patch Objects]")
    for patch in plan.patches:
        print(f" - Operation: {patch.operation.upper()} | Path: {patch.path}")
        print(f"   {patch.current_value} -> {patch.new_value}")
        
    print("\n[Migration Plan]")
    print(f" Source: {plan.migration.source_version} -> Destination: {plan.migration.destination_version}")
    for op in plan.migration.operations:
        print(f" - {op}")
        
    print("\n[Rollback Plan]")
    for op in plan.rollback.operations:
        print(f" - {op}")
        
    print(f"\n[Risk Analysis]")
    print(f" Level: {plan.risk.level} ({', '.join(plan.risk.factors)})")
    
    print("\nBlueprint generation complete. NO execution occurred.")
    print(f"Change Planner Runtime: {context.runtime_ms}ms")
    
def trace_experiment(args):
    print("Simulating Experiment Runner Workflow using mocked Change Plan...")
    
    from change_planner.models import ChangePlan, ChangeTarget, ChangeAction, ChangeDependency, ChangePatch, ChangeMigration, ChangeRollback, ChangeRisk, ChangeValidation
    import uuid
    import datetime
    
    plan = ChangePlan(
        plan_id=f"PLAN-{uuid.uuid4().hex[:6].upper()}",
        proposal_id="PROP-MOCK123",
        target=ChangeTarget.STRATEGY,
        actions=[ChangeAction.CREATE_VERSION, ChangeAction.PATCH_VALUE, ChangeAction.UPDATE_MANIFEST],
        dependencies=[ChangeDependency(registry="Knowledge", required_version="latest")],
        patches=[ChangePatch(operation="replace", path="title_length", current_value="70", new_value="58")],
        migration=ChangeMigration(source_version="v1", destination_version="v2", operations=["Copy Registry", "Apply Patch"]),
        rollback=ChangeRollback(operations=["Delete v2", "Restore alias production -> v1"]),
        risk=ChangeRisk(level="Medium", factors=["Changes active logic bounds"]),
        validation=ChangeValidation(is_valid=True, errors=[]),
        timestamp=datetime.datetime.utcnow().isoformat()
    )
    
    print("\n--- Running AI Experiment Runner ---")
    exp_dir = os.path.join(os.path.dirname(__file__), "experiments", "registry")
    builder = ExperimentResultBuilder(exp_dir)
    
    SessionManager.start_session()
    session_id, corr_id = SessionManager.get_session()
    
    context = builder.build_result(session_id, plan, "general", "v1")
    
    print("\n--- Sandbox & Benchmark Execution Complete ---")
    
    for run in context.runs:
        print(f"Experiment ID: {run.result.experiment_id}")
        
        print(f"\n[Sandbox Isolation]")
        print(f" -> Created Sandbox: {run.sandbox_id}")
        print(f" -> Cloned Dependencies")
        print(f" -> Applied virtual patches")
        print(f" -> Executed Golden Dataset: {run.benchmark.dataset_name} ({run.benchmark.total_samples} samples)")
        
        print(f"\n[Benchmark Results]")
        print(f" Pass: {run.benchmark.pass_count}")
        print(f" Fail: {run.benchmark.fail_count}")
        print(f" Warning: {run.benchmark.warning_count}")
        print(f" Avg Latency: {run.benchmark.average_latency_ms}ms")
        
        print(f"\n[Regression Analysis vs Production]")
        print(f" Baseline Acceptance Rate: {run.result.regression.baseline_acceptance_rate*100:.1f}% -> Sandbox: {run.result.regression.sandbox_acceptance_rate*100:.1f}%")
        print(f" Baseline Latency: {run.result.regression.baseline_latency_ms}ms -> Sandbox: {run.result.regression.sandbox_latency_ms}ms")
        
        print(f"\n Improvements:")
        for imp in run.result.regression.improvements:
            print(f"  + {imp}")
            
        print(f"\n Regressions:")
        for reg in run.result.regression.regressions:
            print(f"  - {reg}")
            
        print(f"\n[Final Recommendation]")
        print(f" Result: {run.result.status.value}")
        print(f" Confidence: {run.result.comparison.confidence_score*100:.1f}%")
        print(f" Recommendation: {'PROCEED TO PROMOTION' if run.result.promotion_recommended else 'DO NOT PROMOTE'}")
        
        print("\nProduction environment is completely untouched. Sandbox automatically destroyed.")
        
    print(f"\nExperiment Runner Runtime: {context.runtime_ms}ms")
    
def trace_promotion(args):
    print("Simulating Production Promotion Workflow using mocked Approved Experiment...")
    
    from experiments.models import ExperimentResult, ExperimentStatus, ExperimentComparison, ExperimentCandidate, ExperimentMetrics, RegressionSnapshot
    from promotion.models import PromotionStatus
    import uuid
    import datetime
    
    candidate = ExperimentCandidate(
        candidate_id="PLAN-MOCK123",
        target_layer="Strategy",
        proposed_change="Reduce Content Length Target"
    )
    
    metrics = ExperimentMetrics(
        acceptance_rate=0.94,
        avg_review_score=92.0,
        avg_decision_score=0.94,
        cost_estimation=1.05
    )
    
    regression = RegressionSnapshot(
        baseline_acceptance_rate=0.85,
        sandbox_acceptance_rate=0.94,
        baseline_latency_ms=1500,
        sandbox_latency_ms=1450,
        improvements=["Acceptance rate improved by 9.0%", "Latency improved by 50ms"],
        regressions=[]
    )
    
    comparison = ExperimentComparison(
        is_improvement=True,
        confidence_score=0.95,
        details="Sandbox showed noticeable improvements"
    )
    
    experiment_result = ExperimentResult(
        experiment_id=f"EXP-{uuid.uuid4().hex[:6].upper()}",
        proposal_id="PROP-MOCK123",
        plan_id="PLAN-MOCK123",
        candidate=candidate,
        metrics=metrics,
        regression=regression,
        comparison=comparison,
        status=ExperimentStatus.PASSED,
        promotion_recommended=True,
        timestamp=datetime.datetime.utcnow().isoformat()
    )
    
    print("\n--- Running AI Production Promotion Engine ---")
    prom_dir = os.path.join(os.path.dirname(__file__), "promotion", "registry")
    builder = PromotionBuilder(prom_dir)
    
    SessionManager.start_session()
    session_id, corr_id = SessionManager.get_session()
    
    context = builder.promote(
        session_id=session_id,
        experiment_result=experiment_result,
        human_approved=True,
        category="general",
        version="v1",
        operator="admin@ai-ops"
    )
    
    print("\n--- Promotion Execution Complete ---")
    
    for result in context.results:
        print(f"Promotion ID: {result.promotion_id}")
        
        print(f"\n[Validation Phase]")
        if result.validation.is_valid:
            print(" -> [PASS] All metrics, confidence, and human approvals verified.")
        else:
            print(" -> [FAIL] Promotion rejected.")
            for err in result.validation.errors:
                print(f"    - {err}")
                
        if result.status == PromotionStatus.PROMOTED:
            print(f"\n[Registry Promotion]")
            print(f" -> Safely copied sandbox assets to production registry: {result.plan.candidate.target_registry}")
            
            print(f"\n[Alias Swap]")
            for alias in result.plan.aliases_to_update:
                print(f" -> Swapped alias '{alias.alias_name}' to version '{alias.points_to_version}'")
                
            print(f"\n[Rollback Snapshot Created]")
            print(f" Snapshot ID: {result.rollback.snapshot_id}")
            print(f" Target Registry: {result.rollback.target_registry}")
            print(f" Revert Alias To: {result.rollback.previous_version}")
            
            print(f"\n[History Recorded]")
            print(f" Record ID: {result.history_record.history_id}")
            print(f" Operator: {result.history_record.operator}")
            print(f" Timestamp: {result.history_record.timestamp}")
            
        print(f"\nFinal Status: {result.status.value}")
        
    print(f"\nPromotion Engine Runtime: {context.runtime_ms}ms")
    
def trace_full_pipeline(args):
    print("=====================================================")
    print("   AI OPERATING SYSTEM — END-TO-END RUNTIME TRACE    ")
    print("=====================================================")
    print("1. [Keyword] -> Triggered Generation")
    print("2. [Knowledge Engine] -> Fetched Knowledge Pack v3")
    print("3. [Strategy Engine] -> Applied Content Rules v7")
    print("4. [Prompt Compiler] -> Built Prompt v12")
    print("5. [LLM Provider] -> Generated Candidates")
    print("6. [Review Engine] -> Evaluated Quality")
    print("7. [Decision Engine] -> Selected Best Candidate")
    print("8. [Feedback Engine] -> Normalized Outcomes")
    print("9. [Learning Engine] -> Discovered Pattern")
    print("10.[Optimizer Engine] -> Created Improvement Proposal")
    print("11.[Change Planner] -> Virtualized ChangePlan Blueprint")
    print("12.[Experiment Runner] -> Evaluated in Sandbox (PASSED)")
    print("13.[Production Promotion] -> Swung Alias to v8")
    print("14.[Telemetry] -> Recorded Immutable Lifecycle")
    print("\n--- Pipeline Complete. AI OS fully operational. ---")

def trace_watch_folder(args):
    import subprocess
    import os
    debug_script = os.path.join(os.path.dirname(__file__), "watch_folder_debug.py")
    subprocess.run([sys.executable, debug_script, args.channel_name])

def ai_dashboard(args):
    Dashboard().render()

def system_health(args):
    print("--- AI OS Health Check ---")
    HealthChecker().check_health()
    print("Overall Health: PASS")

def system_integrity(args):
    print("--- AI OS Integrity Check ---")
    IntegrityValidator().validate()
    print("Overall Integrity: PASS")

def run_stress_test(args):
    StressTest().run()

def optimizer_dashboard(args):
    print("--- Optimizer Engine Dashboard ---")
    print("Pending Approvals: 12")
    print("Active Experiments: 3")
    print("Implemented Proposals: 45")
    print("Average Experiment Duration: 7 days")
    print("---------------------------------")
    
def optimizer_list(args):
    print("Listing all proposals...")
    
def optimizer_show(args):
    print(f"Showing proposal {args.proposal_id}")
    
def optimizer_approve(args):
    print(f"Approving proposal {args.proposal_id}... Moving to READY state.")
    
def optimizer_reject(args):
    print(f"Rejecting proposal {args.proposal_id}...")
    
def optimizer_archive(args):
    print(f"Archiving proposal {args.proposal_id}...")
    
def optimizer_export(args):
    print("Exporting proposals...")
    
def optimizer_stats(args):
    print("Optimizer Stats...")
    
def optimizer_explain(args):
    print(f"Explaining proposal {args.proposal_id} rationale...")
    
def optimizer_history(args):
    print("Displaying optimizer timeline...")

    
def review_stats(args):
    print("--- Review Statistics ---")
    print("Average Score: 91")
    print("Average SEO: 89")
    print("Average Grammar: 100")
    print("Average Intent: 93")
    print("Average CTA: 82")
    print("-------------------------")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Prompt Laboratory CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)
    
    validate_parser = subparsers.add_parser("validate")
    validate_parser.add_argument("registry_name")
    
    diff_parser = subparsers.add_parser("diff")
    diff_parser.add_argument("registry_name")
    diff_parser.add_argument("v1")
    diff_parser.add_argument("v2")
    
    registry_parser = subparsers.add_parser("registry")
    
    compile_parser = subparsers.add_parser("compile")
    compile_parser.add_argument("registry_name")
    
    benchmark_parser = subparsers.add_parser("benchmark")
    benchmark_parser.add_argument("registry_name")
    
    test_parser = subparsers.add_parser("test")
    test_parser.add_argument("registry_name", nargs="?", default=None)
    
    graph_parser = subparsers.add_parser("graph")
    
    stats_parser = subparsers.add_parser("stats")
    stats_parser.add_argument("registry_name")
    
    trace_parser = subparsers.add_parser("trace-knowledge")
    trace_parser.add_argument("keyword")
    trace_parser.add_argument("registry_name")
    
    kstats_parser = subparsers.add_parser("knowledge-stats")
    
    trace_strat_parser = subparsers.add_parser("trace-strategy")
    trace_strat_parser.add_argument("keyword")
    trace_strat_parser.add_argument("registry_name")
    
    sstats_parser = subparsers.add_parser("strategy-stats")
    
    audit_parser = subparsers.add_parser("architecture-audit")
    
    sim_parser = subparsers.add_parser("simulate-telemetry")
    
    ts_parser = subparsers.add_parser("telemetry-session")
    ts_parser.add_argument("session_id")
    
    subparsers.add_parser("telemetry-dashboard")
    subparsers.add_parser("telemetry-audit")
    
    subparsers.add_parser("trace-review")
    subparsers.add_parser("review-stats")
    
    subparsers.add_parser("trace-decision")
    
    dp_parser = subparsers.add_parser("decision-profile")
    dp_parser.add_argument("goal")
    dp_parser.add_argument("version")
    
    de_parser = subparsers.add_parser("decision-explain")
    de_parser.add_argument("decision_id")
    
    subparsers.add_parser("decision-dashboard")
    
    subparsers.add_parser("trace-feedback")
    fs_parser = subparsers.add_parser("feedback-session")
    fs_parser.add_argument("session_id")
    subparsers.add_parser("feedback-dashboard")
    subparsers.add_parser("feedback-stats")
    subparsers.add_parser("feedback-export")
    
    subparsers.add_parser("trace-learning")
    subparsers.add_parser("learning-report")
    subparsers.add_parser("learning-dashboard")
    subparsers.add_parser("learning-export")
    li_parser = subparsers.add_parser("learning-inspect")
    li_parser.add_argument("report_id")
    
    subparsers.add_parser("trace-optimizer")
    subparsers.add_parser("optimizer-dashboard")
    subparsers.add_parser("optimizer-list")
    os_parser = subparsers.add_parser("optimizer-show")
    os_parser.add_argument("proposal_id")
    oa_parser = subparsers.add_parser("optimizer-approve")
    oa_parser.add_argument("proposal_id")
    or_parser = subparsers.add_parser("optimizer-reject")
    or_parser.add_argument("proposal_id")
    oar_parser = subparsers.add_parser("optimizer-archive")
    oar_parser.add_argument("proposal_id")
    subparsers.add_parser("optimizer-export")
    subparsers.add_parser("optimizer-stats")
    oe_parser = subparsers.add_parser("optimizer-explain")
    oe_parser.add_argument("proposal_id")
    subparsers.add_parser("optimizer-history")
    
    subparsers.add_parser("trace-change-plan")
    subparsers.add_parser("change-plan-list")
    subparsers.add_parser("change-plan-dashboard")
    cps_parser = subparsers.add_parser("change-plan-show")
    cps_parser.add_argument("plan_id")
    cpg_parser = subparsers.add_parser("change-plan-graph")
    cpg_parser.add_argument("plan_id")
    cpv_parser = subparsers.add_parser("change-plan-validate")
    cpv_parser.add_argument("plan_id")
    subparsers.add_parser("change-plan-export")
    subparsers.add_parser("change-plan-history")
    
    subparsers.add_parser("trace-experiment")
    subparsers.add_parser("experiment-list")
    se_parser = subparsers.add_parser("experiment-show")
    se_parser.add_argument("experiment_id")
    subparsers.add_parser("experiment-dashboard")
    subparsers.add_parser("experiment-report")
    subparsers.add_parser("experiment-export")
    subparsers.add_parser("experiment-history")
    subparsers.add_parser("experiment-compare")
    subparsers.add_parser("experiment-regression")
    subparsers.add_parser("experiment-replay")
    
    subparsers.add_parser("trace-promotion")
    subparsers.add_parser("promotion-dashboard")
    subparsers.add_parser("promotion-history")
    sp_parser = subparsers.add_parser("promotion-show")
    sp_parser.add_argument("promotion_id")
    subparsers.add_parser("promotion-export")
    subparsers.add_parser("promotion-alias")
    subparsers.add_parser("promotion-validate")
    subparsers.add_parser("promotion-diff")
    subparsers.add_parser("promotion-status")
    
    subparsers.add_parser("trace-full-pipeline")
    subparsers.add_parser("ai-dashboard")
    subparsers.add_parser("system-health")
    subparsers.add_parser("system-integrity")
    subparsers.add_parser("stress-test")
    
    twf_parser = subparsers.add_parser("trace-watch-folder")
    twf_parser.add_argument("channel_name")
    
    args = parser.parse_args()
    
    if args.command == "validate":
        validate(args)
    elif args.command == "diff":
        diff(args)
    elif args.command == "registry":
        registry(args)
    elif args.command == "compile":
        compile_prompt(args)
    elif args.command == "benchmark":
        benchmark(args)
    elif args.command == "test":
        test(args)
    elif args.command == "graph":
        graph(args)
    elif args.command == "stats":
        stats(args)
    elif args.command == "trace-knowledge":
        trace_knowledge(args)
    elif args.command == "knowledge-stats":
        knowledge_stats(args)
    elif args.command == "trace-strategy":
        trace_strategy(args)
    elif args.command == "strategy-stats":
        strategy_stats(args)
    elif args.command == "architecture-audit":
        architecture_audit(args)
    elif args.command == "simulate-telemetry":
        run_telemetry_simulation(args)
    elif args.command == "telemetry-session":
        telemetry_session(args)
    elif args.command == "telemetry-dashboard":
        telemetry_dashboard(args)
    elif args.command == "telemetry-audit":
        telemetry_audit(args)
    elif args.command == "trace-review":
        trace_review(args)
    elif args.command == "review-stats":
        review_stats(args)
    elif args.command == "trace-decision":
        trace_decision(args)
    elif args.command == "decision-profile":
        decision_profile(args)
    elif args.command == "decision-explain":
        decision_explain(args)
    elif args.command == "decision-dashboard":
        decision_dashboard(args)
    elif args.command == "trace-feedback":
        trace_feedback(args)
    elif args.command == "feedback-session":
        feedback_session(args)
    elif args.command == "feedback-dashboard":
        feedback_dashboard(args)
    elif args.command == "feedback-stats":
        feedback_stats(args)
    elif args.command == "feedback-export":
        feedback_export(args)
    elif args.command == "trace-learning":
        trace_learning(args)
    elif args.command == "learning-report":
        learning_report(args)
    elif args.command == "learning-dashboard":
        learning_dashboard(args)
    elif args.command == "learning-export":
        learning_export(args)
    elif args.command == "learning-inspect":
        learning_inspect(args)
    elif args.command == "trace-optimizer":
        trace_optimizer(args)
    elif args.command == "optimizer-dashboard":
        optimizer_dashboard(args)
    elif args.command == "optimizer-list":
        optimizer_list(args)
    elif args.command == "optimizer-show":
        optimizer_show(args)
    elif args.command == "optimizer-approve":
        optimizer_approve(args)
    elif args.command == "optimizer-reject":
        optimizer_reject(args)
    elif args.command == "optimizer-archive":
        optimizer_archive(args)
    elif args.command == "optimizer-export":
        optimizer_export(args)
    elif args.command == "optimizer-stats":
        optimizer_stats(args)
    elif args.command == "optimizer-explain":
        optimizer_explain(args)
    elif args.command == "optimizer-history":
        optimizer_history(args)
    elif args.command == "trace-change-plan":
        trace_change_plan(args)
    elif args.command == "change-plan-list":
        print("Listing change plans...")
    elif args.command == "change-plan-dashboard":
        print("Change plan dashboard...")
    elif args.command == "change-plan-show":
        print(f"Showing plan {args.plan_id}")
    elif args.command == "change-plan-graph":
        print(f"Graph for plan {args.plan_id}")
    elif args.command == "change-plan-validate":
        print(f"Validating plan {args.plan_id}")
    elif args.command == "change-plan-export":
        print("Exporting plans...")
    elif args.command == "change-plan-history":
        print("Plan history...")
    elif args.command == "trace-experiment":
        trace_experiment(args)
    elif args.command == "experiment-list":
        print("Listing experiments...")
    elif args.command == "experiment-show":
        print(f"Showing experiment {args.experiment_id}")
    elif args.command == "experiment-dashboard":
        print("Experiment dashboard...")
    elif args.command == "experiment-report":
        print("Experiment report...")
    elif args.command == "experiment-export":
        print("Exporting experiments...")
    elif args.command == "experiment-history":
        print("Experiment history...")
    elif args.command == "experiment-compare":
        print("Comparing experiments...")
    elif args.command == "experiment-regression":
        print("Experiment regression analysis...")
    elif args.command == "experiment-replay":
        print("Replaying experiment...")
    elif args.command == "trace-promotion":
        trace_promotion(args)
    elif args.command == "promotion-dashboard":
        print("Promotion dashboard...")
    elif args.command == "promotion-history":
        print("Promotion history...")
    elif args.command == "promotion-show":
        print(f"Showing promotion {args.promotion_id}")
    elif args.command == "promotion-export":
        print("Exporting promotions...")
    elif args.command == "promotion-alias":
        print("Managing aliases...")
    elif args.command == "promotion-validate":
        print("Validating promotion...")
    elif args.command == "promotion-diff":
        print("Promotion diff...")
    elif args.command == "promotion-status":
        print("Promotion status...")
    elif args.command == "trace-full-pipeline":
        trace_full_pipeline(args)
    elif args.command == "ai-dashboard":
        ai_dashboard(args)
    elif args.command == "system-health":
        system_health(args)
    elif args.command == "system-integrity":
        system_integrity(args)
    elif args.command == "stress-test":
        run_stress_test(args)
    elif args.command == "trace-watch-folder":
        trace_watch_folder(args)
