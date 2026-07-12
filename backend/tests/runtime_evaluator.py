import os
import sys
import json
import time
import asyncio
import hashlib
from datetime import datetime

# Setup paths to import from backend
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.append(backend_dir)

import alembic.config
import alembic.command
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import UploadTask, GlobalSettings, AIGenerationHistory, Channel, Profile
from services.upload_service import UploadService, GenerateMetadataRequest
from prompts.manager import PromptManager

CONCURRENCY_LIMIT = 3
TIMEOUT_SECONDS = 60.0

class RuleEvaluator:
    @staticmethod
    def evaluate(keyword, expected, response_data, raw_json):
        result = {"status": "PASS", "warnings": [], "failures": []}
        
        if not response_data or not raw_json:
            result["status"] = "FAIL"
            result["failures"].append("Empty response or JSON Parse Error")
            return result
            
        try:
            parsed = json.loads(raw_json)
        except json.JSONDecodeError:
            result["status"] = "FAIL"
            result["failures"].append("Invalid JSON")
            return result

        # Evaluation Mode flat schema vs Production nested schema
        alts = parsed.get("alternatives", {})
        if alts:
            titles = alts.get("titles", [])
            descs = alts.get("descriptions", [])
            tags = alts.get("tags", [])
        else:
            t = parsed.get("title")
            d = parsed.get("description")
            titles = [t] if t else []
            descs = [d] if d else []
            tags = parsed.get("tags", [])
        
        if not titles or not descs or not tags:
            result["status"] = "FAIL"
            result["failures"].append("Missing titles, descriptions, or tags arrays")
            return result
            
        best_title = titles[0]
        best_desc = descs[0]
        
        # 1. Keyword in Title
        if keyword.lower() not in best_title.lower():
            result["warnings"].append("Keyword not perfectly matched in Title")
            
        # 2. Title Length
        if len(best_title) < 20:
            result["warnings"].append("Title too short (<20)")
        if len(best_title) > 100:
            result["warnings"].append("Title too long (>100)")
            
        # 3. Description Length
        if len(best_desc) < 150:
            result["warnings"].append("Description too short (<150)")
            
        # 4. CTA
        cta_keywords = ["subscribe", "like", "comment", "link", "follow", "tonton", "langganan"]
        if not any(c in best_desc.lower() for c in cta_keywords):
            result["failures"].append("Missing CTA")
            
        # 5. Tag Count
        if len(tags) < 10:
            result["warnings"].append(f"Not enough tags ({len(tags)})")
            
        # 6. Duplicate Tags
        tag_lower = [t.lower() for t in tags]
        if len(tag_lower) != len(set(tag_lower)):
            result["failures"].append("Duplicate Tags")
            
        # 7. Hallucinations
        hallucinated_years = ["2024", "2025", "2026", "2027"]
        
        for y in hallucinated_years:
            if y in best_title and y not in keyword:
                result["failures"].append(f"Hallucinated Year '{y}'")
        
        for expected_no in expected.get("must_not_contain", []):
            if expected_no.lower() in best_title.lower() and expected_no.lower() not in keyword.lower():
                result["failures"].append(f"Hallucinated '{expected_no}'")
                
        # 8. Keyword Coverage
        for expected_yes in expected.get("must_contain", []):
            found_anywhere = (
                expected_yes.lower() in best_title.lower() or 
                expected_yes.lower() in best_desc.lower() or 
                any(expected_yes.lower() in t.lower() for t in tags)
            )
            if not found_anywhere:
                result["failures"].append("Keyword Coverage")
                
        if result["failures"]:
            result["status"] = "FAIL"
        elif result["warnings"]:
            result["status"] = "WARNING"
            
        return result

async def worker(kw_data, SessionLocal, sem, worker_id, progress_state):
    async with sem:
        db = SessionLocal()
        try:
            channel = db.query(Channel).first()
            profile = db.query(Profile).first()
            
            task = UploadTask(
                id=f"test_qa_task_{worker_id}_{int(time.time()*1000)}",
                channel_id=channel.id,
                profile_id=profile.id,
                metadata_source="GEMINI",
                source_type="MANUAL_UPLOAD",
                package_folder="/test",
                video_path="/test/vid.mp4",
                title="Original Title",
                description="Original Desc"
            )
            db.add(task)
            db.commit()
            
            req = GenerateMetadataRequest(
                keyword=kw_data["keyword"],
                language=kw_data["language"],
                content_type=kw_data["content_type"],
                seo_mode="SEO Maximum",
                is_evaluation_mode=True
            )
            
            start_time = time.time()
            try:
                res = await asyncio.wait_for(
                    UploadService.generate_metadata(db, task.id, req),
                    timeout=TIMEOUT_SECONDS
                )
                raw_json = json.dumps(res.get("data", {}))
                error_reason = None
            except asyncio.TimeoutError:
                res = {"success": False}
                raw_json = None
                error_reason = "Timeout"
            except Exception as e:
                res = {"success": False}
                raw_json = None
                error_reason = str(e)
                
            runtime = time.time() - start_time
            
            if error_reason:
                eval_res = {"status": "FAIL", "failures": [error_reason], "warnings": []}
            else:
                eval_res = RuleEvaluator.evaluate(kw_data["keyword"], kw_data["expected"], res.get("data"), raw_json)
                
            prompt_meta = PromptManager.get_prompt(kw_data["content_type"])
            prompt_hash = hashlib.sha256(prompt_meta["template"].encode('utf-8')).hexdigest()
            
            # Print Progress
            progress_state["completed"] += 1
            idx = progress_state["completed"]
            total = progress_state["total"]
            
            # Calculate ETA
            progress_state["total_runtime"] += runtime
            avg_runtime = progress_state["total_runtime"] / idx
            remaining = total - idx
            eta_seconds = remaining * avg_runtime / CONCURRENCY_LIMIT
            eta_m, eta_s = divmod(int(eta_seconds), 60)
            
            provider = res.get("provider", "Unknown") if res.get("success") else "Unknown"
            
            print(f"[{idx}/{total}]")
            print(f"Keyword:\n{kw_data['keyword']}")
            print(f"Provider:\n{provider}")
            print(f"Runtime:\n{runtime:.2f} sec")
            print(f"Status:\n{eval_res['status']}")
            print(f"ETA:\n{eta_m}m {eta_s}s\n", flush=True)
            
            return {
                "Keyword": kw_data["keyword"],
                "Content Type": kw_data["content_type"],
                "Provider": provider,
                "Model": res.get("model", "Unknown") if res.get("success") else "Unknown",
                "Prompt Name": res.get("prompt_name", "Unknown") if res.get("success") else "Unknown",
                "Prompt Hash": prompt_hash,
                "Runtime": runtime,
                "Raw Response": raw_json,
                "Evaluation Result": eval_res,
                "Timestamp": datetime.utcnow().isoformat()
            }
        finally:
            db.close()


async def main():
    print("[INIT] Setting up isolated Test Database...")
    source_db = os.path.join(backend_dir, "app_v2.db")
    db_path = os.path.join(backend_dir, "tests", "runtime_eval.db")
    
    if os.path.exists(db_path):
        os.remove(db_path)
        
    import shutil
    shutil.copy2(source_db, db_path)
        
    url = f"sqlite:///{db_path}"
    os.environ["DATABASE_URL"] = url
    
    alembic_cfg = alembic.config.Config(os.path.join(backend_dir, "alembic.ini"))
    alembic_cfg.set_main_option("sqlalchemy.url", url)
    alembic.command.upgrade(alembic_cfg, "head")
    
    engine = create_engine(url, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    print("[INIT] Cleaning copied database tables (only task and history)...")
    db.execute(UploadTask.__table__.delete())
    db.execute(AIGenerationHistory.__table__.delete())
    db.commit()
    
    settings = db.query(GlobalSettings).first()
    if not settings:
        print("[ERROR] No GlobalSettings found in DB!")
        sys.exit(1)
        
    channel = db.query(Channel).first()
    if not channel:
        channel = Channel(id="test_acc_123", channel_name="Test Channel")
        db.add(channel)
        db.commit()
        
    profile = db.query(Profile).first()
    if not profile:
        profile = Profile(id="test_prof_123", name="Test Profile")
        db.add(profile)
        db.commit()
    db.close()
    
    dataset_dir = os.path.join(backend_dir, "tests", "ai_runtime_dataset")
    dataset_files = ["music.json", "gaming.json", "education.json", "podcast.json", "ambience.json"]
    
    all_keywords = []
    for f in dataset_files:
        path = os.path.join(dataset_dir, f)
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as file:
                all_keywords.extend(json.load(file))
                
    # ==========================
    # FULL BENCHMARK (100 Keywords)
    # ==========================
    # all_keywords = all_keywords[:5]
    
    print(f"[DATASET] Loaded {len(all_keywords)} keywords for testing.", flush=True)
    
    timestamp_folder = datetime.now().strftime("%Y%m%d_%H%M%S")
    proof_dir = os.path.join(backend_dir, "runtime_proof", timestamp_folder)
    os.makedirs(proof_dir, exist_ok=True)
    
    print(f"[EXECUTE] Starting AI Generator ({CONCURRENCY_LIMIT} concurrency limit)...", flush=True)
    
    sem = asyncio.Semaphore(CONCURRENCY_LIMIT)
    progress_state = {"completed": 0, "total": len(all_keywords), "total_runtime": 0}
    
    tasks = []
    for i, kw_data in enumerate(all_keywords):
        tasks.append(worker(kw_data, SessionLocal, sem, i, progress_state))
        
    results = await asyncio.gather(*tasks)
    
    print("[REPORTING] Generating reports...")
    
    with open(os.path.join(proof_dir, "runtime_results.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
        
    summary = {
        "dataset_version": "1.0",
        "pass": 0, "warning": 0, "fail": 0,
        "total_runtime_ms": 0,
        "title_length_sum": 0, "desc_length_sum": 0, "tag_count_sum": 0,
        "total_requests": len(results),
        "failures_breakdown": {
            "Hallucinated Years": 0,
            "Duplicate Tags": 0,
            "Missing CTA": 0,
            "Keyword Coverage": 0,
            "JSON Parse Failures": 0,
            "Timeout Count": 0,
            "Provider Errors": 0
        }
    }
    
    runtimes = []
    
    for r in results:
        eval_res = r["Evaluation Result"]
        st = eval_res["status"].lower()
        summary[st] += 1
        summary["total_runtime_ms"] += (r["Runtime"] * 1000)
        runtimes.append(r["Runtime"])
        
        parsed = None
        if r.get("Raw Response"):
            try:
                parsed = json.loads(r["Raw Response"])
            except:
                pass
                
        alts = parsed.get("alternatives", {}) if parsed else {}
        if alts:
            titles = alts.get("titles", [""])
            descs = alts.get("descriptions", [""])
            tags = alts.get("tags", [])
        else:
            titles = [parsed.get("title", "")] if parsed else [""]
            descs = [parsed.get("description", "")] if parsed else [""]
            tags = parsed.get("tags", []) if parsed else []
            
        summary["title_length_sum"] += len(titles[0] if titles else "")
        summary["desc_length_sum"] += len(descs[0] if descs else "")
        summary["tag_count_sum"] += len(tags)
        
        # Breakdowns
        for failure in eval_res.get("failures", []):
            if "Timeout" in failure: summary["failures_breakdown"]["Timeout Count"] += 1
            elif "Empty response" in failure or "Invalid JSON" in failure: summary["failures_breakdown"]["JSON Parse Failures"] += 1
            elif "Missing CTA" in failure: summary["failures_breakdown"]["Missing CTA"] += 1
            elif "Duplicate Tags" in failure: summary["failures_breakdown"]["Duplicate Tags"] += 1
            elif "Hallucinated Year" in failure: summary["failures_breakdown"]["Hallucinated Years"] += 1
            elif "Keyword Coverage" in failure: summary["failures_breakdown"]["Keyword Coverage"] += 1
            else: summary["failures_breakdown"]["Provider Errors"] += 1
            
    runtimes.sort()
    median_runtime = runtimes[len(runtimes)//2] if runtimes else 0
            
    final_summary = {**summary}
    final_summary["average_runtime"] = (summary["total_runtime_ms"] / summary["total_requests"] / 1000.0) if summary["total_requests"] else 0
    final_summary["median_runtime"] = median_runtime
    final_summary["average_title_length"] = summary["title_length_sum"] // summary["total_requests"] if summary["total_requests"] else 0
    final_summary["average_description_length"] = summary["desc_length_sum"] // summary["total_requests"] if summary["total_requests"] else 0
    final_summary["average_tags"] = summary["tag_count_sum"] // summary["total_requests"] if summary["total_requests"] else 0
    
    if results:
        final_summary["provider"] = results[0]["Provider"]
        final_summary["model"] = results[0]["Model"]
        final_summary["prompt_name"] = "Mixed"
        final_summary["prompt_version"] = "Mixed"
    
    with open(os.path.join(proof_dir, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(final_summary, f, indent=2)
        
    baseline_path = os.path.join(backend_dir, "runtime_proof", "AI_BASELINE.json")
    
    if os.path.exists(baseline_path):
        with open(baseline_path, "r", encoding="utf-8") as f:
            old_baseline = json.load(f)
            
        reg_report_path = os.path.join(proof_dir, "AI_REGRESSION_REPORT.md")
        with open(reg_report_path, "w", encoding="utf-8") as f:
            f.write("# AI Regression Report\n\n")
            old_pass = old_baseline.get("pass", 0)
            new_pass = final_summary["pass"]
            
            old_pass_pct = (old_pass / max(1, old_baseline.get("total_requests", 1))) * 100
            new_pass_pct = (new_pass / max(1, final_summary["total_requests"])) * 100
            
            if new_pass_pct > old_pass_pct:
                f.write("Status: **Improved**\n\n")
            elif new_pass_pct < old_pass_pct:
                f.write("Status: **Regressed**\n\n")
            else:
                f.write("Status: **No Significant Change**\n\n")
                
            f.write(f"- Old PASS: {old_pass_pct:.1f}% -> New PASS: {new_pass_pct:.1f}%\n")
            
            old_fail = old_baseline.get("fail", 0)
            old_fail_pct = (old_fail / max(1, old_baseline.get("total_requests", 1))) * 100
            new_fail_pct = (final_summary["fail"] / max(1, final_summary["total_requests"])) * 100
            f.write(f"- Old FAIL: {old_fail_pct:.1f}% -> New FAIL: {new_fail_pct:.1f}%\n")
            
            old_rt = old_baseline.get("average_runtime", 0)
            new_rt = final_summary["average_runtime"]
            rt_delta = ((new_rt - old_rt) / max(old_rt, 1)) * 100 if old_rt else 0
            f.write(f"- Average Runtime: {old_rt:.2f}s -> {new_rt:.2f}s ({rt_delta:+.1f}%)\n")
            
    with open(baseline_path, "w", encoding="utf-8") as f:
        json.dump(final_summary, f, indent=2)
        
    # Top 10 Best and Worst
    best_outputs = sorted([r for r in results if r["Evaluation Result"]["status"] == "PASS"], key=lambda x: x["Runtime"])[:10]
    worst_outputs = sorted([r for r in results if r["Evaluation Result"]["status"] != "PASS"], key=lambda x: len(x["Evaluation Result"].get("failures", [])) + len(x["Evaluation Result"].get("warnings", [])), reverse=True)[:10]
    
    with open(os.path.join(proof_dir, "AI_RUNTIME_REPORT.md"), "w", encoding="utf-8") as f:
        f.write("# AI Runtime Quality Report\n\n")
        f.write("## Overview\n")
        f.write(f"- PASS: {summary['pass']}\n")
        f.write(f"- WARNING: {summary['warning']}\n")
        f.write(f"- FAIL: {summary['fail']}\n")
        f.write(f"- Average Runtime: {final_summary['average_runtime']:.2f}s\n")
        f.write(f"- Median Runtime: {final_summary['median_runtime']:.2f}s\n\n")
        
        f.write("## Top 10 Best Outputs\n")
        for i, b in enumerate(best_outputs):
            f.write(f"### {i+1}. {b['Keyword']}\n")
            f.write(f"- **Runtime**: {b['Runtime']:.2f}s\n")
            f.write(f"- **Provider**: {b['Provider']} | **Model**: {b['Model']}\n")
            if b['Raw Response']:
                p = json.loads(b['Raw Response'])
                t = p.get("title", "") if "title" in p else p.get("alternatives", {}).get("titles", [""])[0]
                f.write(f"- **Title**: {t}\n")
            f.write(f"- **Reasoning**: Evaluator matched all expectations.\n\n")
            
        f.write("## Top 10 Worst Outputs\n")
        for i, w in enumerate(worst_outputs):
            f.write(f"### {i+1}. {w['Keyword']}\n")
            f.write(f"- **Status**: {w['Evaluation Result']['status']}\n")
            f.write(f"- **Runtime**: {w['Runtime']:.2f}s\n")
            f.write(f"- **Root Cause**: {', '.join(w['Evaluation Result'].get('failures', []) + w['Evaluation Result'].get('warnings', []))}\n")
            f.write(f"- **Recommendation**: Review constraints for {w['Content Type']}.\n\n")
            
    try:
        os.remove(db_path)
    except:
        pass
        
    print("[DONE] Audit complete. Outputs written to backend/runtime_proof/.", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
