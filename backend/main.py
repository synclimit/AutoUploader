from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware

import shutil
import os
import sys
import logging
import json

if getattr(sys, 'frozen', False):
    BASE_DIR = getattr(sys, '_MEIPASS', os.path.dirname(sys.executable))
    base_dir = BASE_DIR
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    base_dir = BASE_DIR
    if base_dir not in sys.path:
        sys.path.insert(0, base_dir)

from datetime import datetime
from sqlalchemy import text

from services.system.path_service import PathService

# 1. Migrate paths if this is the first run before DB binds
PathService.perform_first_run_migration()

from database.db import engine, SessionLocal
from models import Base, UploadTask

from api.profiles import router as profiles_router
from api.channels import router as accounts_router
from api.queue_router import router as queue_router
from api.watch_folder import router as watch_folder_router
from api.upload_engine import router as upload_engine_router
from api.settings import router as settings_router
from api.history import router as history_router
from api.dashboard import router as dashboard_router
from api.import_api import router as import_router
from api.system import router as system_router
from api.media import router as media_router
from api.ai_engine import router as ai_engine_router
from api.license import router as license_router
from api.analytics import router as analytics_router
from api.campaign_assets import router as campaign_assets_router
from api.campaign_scan import router as campaign_scan_router
from api.campaign_review import router as campaign_review_router
from api.campaign_queue import router as campaign_queue_router
from api.campaign_execution import router as campaign_execution_router
from api.routers.oauth_router import router as oauth_router

from services.watch_folder.engine import get_engine as get_wf_engine
from services.upload_engine.engine import get_engine as get_upload_engine
from services.campaign_execution_service import get_campaign_execution_engine
from scheduler.upload_scheduler import get_scheduler_engine
from scheduler.metadata_sync_scheduler import get_metadata_sync_engine
from services.ai.automation import get_ai_automation_engine

# Configure logging so Watch Folder Engine output is visible and logs are saved to a file
log_dir = PathService.get_logs_dir()
log_file = os.path.join(log_dir, "autouploader.log")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiles_router)
app.include_router(accounts_router)
app.include_router(oauth_router)
app.include_router(queue_router)
app.include_router(watch_folder_router)
app.include_router(upload_engine_router)
app.include_router(settings_router)
app.include_router(history_router)
app.include_router(dashboard_router)
app.include_router(import_router)
app.include_router(system_router)
app.include_router(media_router)
app.include_router(ai_engine_router)
app.include_router(license_router)
app.include_router(analytics_router)
app.include_router(campaign_assets_router)
app.include_router(campaign_scan_router)
app.include_router(campaign_review_router)
app.include_router(campaign_queue_router)
app.include_router(campaign_execution_router)

# Enable SQLAlchemy create_all to ensure tables are created on fresh installs or wiped databases
Base.metadata.create_all(bind=engine)


@app.on_event("startup")
def startup_event():
    """Start the background threads and diagnostic verification."""
    try:
        from services.system.diagnostic_service import diagnostic_service
        diagnostic_service.log("INFO", "SYSTEM", "STARTUP", "Application backend initialized successfully.")
        
        # Verify update version post-restart
        update_flag_file = os.path.join(PathService.get_logs_dir(), "pending_update_verify.json")
        if os.path.exists(update_flag_file):
            try:
                with open(update_flag_file, "r") as uf:
                    u_data = json.load(uf)
                os.remove(update_flag_file)
                
                expected_ver = u_data.get("expected_version")
                frozen = getattr(sys, 'frozen', False)
                base_dir = sys._MEIPASS if frozen else os.path.dirname(os.path.abspath(__file__))
                version_file = os.path.join(base_dir, "version.json")
                actual_ver = None
                if os.path.exists(version_file):
                    with open(version_file, "r") as vf:
                        actual_ver = "v" + json.load(vf).get("version", "")
                        
                if expected_ver and actual_ver and expected_ver.lower() != actual_ver.lower():
                    diagnostic_service.log(
                        "ERROR",
                        "UPDATE",
                        "VERSION_VERIFY_FAILED",
                        f"Update applied but version mismatch detected. Expected: {expected_ver}, Actual: {actual_ver}",
                        error_id="ERR-UPDATE-VERSION-MISMATCH",
                        details={"expected": expected_ver, "actual": actual_ver}
                    )
                else:
                    diagnostic_service.log("INFO", "UPDATE", "VERSION_VERIFY_SUCCESS", f"Update verified successfully. Running version: {actual_ver or expected_ver}")
            except Exception as ve:
                print("Update verification notice:", ve)
    except Exception as e:
        print("[Diagnostic Startup Notice]", e)

    try:
        from database.db import SessionLocal, engine
        from sqlalchemy import text, inspect
        db = SessionLocal()
        inspector = inspect(engine)
        
        migrations = {
            "channels": [
                ("youtube_name", "VARCHAR"),
                ("channel_id", "VARCHAR"),
                ("subscribers", "VARCHAR"),
                ("avatar_url", "VARCHAR"),
                ("profile_id", "VARCHAR"),
                ("project_id", "VARCHAR"),
                ("client_id", "VARCHAR"),
                ("credential_folder", "VARCHAR"),
                ("health_status", "VARCHAR DEFAULT 'UNKNOWN'"),
                ("quota_exhausted_until", "DATETIME"),
                ("source_type", "VARCHAR DEFAULT 'M1_VIDEO_SPLITTER'"),
                ("region", "VARCHAR DEFAULT 'Indonesia'"),
                ("watch_folder", "VARCHAR"),
                ("watch_folder_enabled", "BOOLEAN DEFAULT 0"),
                ("publish_enabled", "BOOLEAN DEFAULT 0"),
                ("preferred_publish_time", "VARCHAR"),
                ("publish_timezone", "VARCHAR DEFAULT 'UTC'"),
                ("publish_variance", "INTEGER DEFAULT 0"),
                ("publish_mode", "VARCHAR DEFAULT 'exact'"),
                ("publish_days", "VARCHAR DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun'"),
                ("publish_visibility", "VARCHAR DEFAULT 'public'"),
                ("review_before_publish", "BOOLEAN DEFAULT 1"),
                ("import_folder", "VARCHAR"),
                ("browser_profile", "VARCHAR"),
                ("metadata_profile", "VARCHAR"),
                ("upload_preset", "VARCHAR"),
                ("playlist", "VARCHAR"),
                ("upload_provider", "VARCHAR DEFAULT 'api'"),
                ("category", "VARCHAR DEFAULT '20'"),
                ("audience", "VARCHAR DEFAULT 'not_kids'"),
                ("license", "VARCHAR DEFAULT 'standard'"),
                ("language", "VARCHAR DEFAULT 'en'"),
                ("ai_preset", "VARCHAR DEFAULT 'gaming_v1'"),
                ("upload_defaults", "VARCHAR DEFAULT '{}'"),
                ("advanced_settings", "VARCHAR DEFAULT '{}'"),
                ("ai_identity", "VARCHAR DEFAULT '{}'"),
                ("schedule_profile", "VARCHAR DEFAULT '{}'"),
                ("pipelines", "VARCHAR DEFAULT '{}'"),
                ("pipeline_states", "VARCHAR DEFAULT '{}'"),
                ("schema_version", "INTEGER DEFAULT 1"),
                ("created_at", "DATETIME"),
                ("updated_at", "DATETIME")
            ],
            "upload_tasks": [
                ("account_id", "VARCHAR"),
                ("channel_id", "VARCHAR"),
                ("profile_id", "VARCHAR"),
                ("status", "VARCHAR DEFAULT 'WATCHED'"),
                ("upload_stage", "VARCHAR DEFAULT 'NONE'"),
                ("metadata_source", "VARCHAR"),
                ("source_type", "VARCHAR"),
                ("source_id", "VARCHAR"),
                ("execution_source", "VARCHAR"),
                ("correlation_id", "VARCHAR"),
                ("execution_no", "INTEGER"),
                ("package_folder", "VARCHAR"),
                ("video_path", "VARCHAR"),
                ("file_name", "VARCHAR"),
                ("file_size", "INTEGER"),
                ("thumbnail_path", "VARCHAR"),
                ("metadata_path", "VARCHAR"),
                ("timestamps_path", "VARCHAR"),
                ("title", "VARCHAR"),
                ("description", "VARCHAR"),
                ("tags", "VARCHAR"),
                ("privacy_status", "VARCHAR DEFAULT 'private'"),
                ("made_for_kids", "BOOLEAN DEFAULT 0"),
                ("video_id", "VARCHAR"),
                ("playlist_id", "VARCHAR"),
                ("playlist_title", "VARCHAR"),
                ("category_id", "INTEGER"),
                ("ai_use", "VARCHAR DEFAULT 'UNKNOWN'"),
                ("default_language", "VARCHAR"),
                ("audio_language", "VARCHAR"),
                ("recording_date", "DATETIME"),
                ("license", "VARCHAR"),
                ("audience", "VARCHAR"),
                ("notify_subscribers", "BOOLEAN DEFAULT 1"),
                ("embeddable", "BOOLEAN DEFAULT 1"),
                ("public_stats_viewable", "BOOLEAN DEFAULT 1"),
                ("youtube_video_id", "VARCHAR"),
                ("youtube_url", "VARCHAR"),
                ("pipeline_type", "VARCHAR"),
                ("schedule_mode", "VARCHAR"),
                ("schedule_time", "VARCHAR"),
                ("humanize_enabled", "BOOLEAN DEFAULT 0"),
                ("humanize_min", "INTEGER DEFAULT 0"),
                ("humanize_max", "INTEGER DEFAULT 0"),
                ("upload_mode", "VARCHAR DEFAULT 'Waiting For Approval'"),
                ("ai_metadata_generated", "BOOLEAN DEFAULT 0"),
                ("retry_count", "INTEGER DEFAULT 0"),
                ("failure_reason", "VARCHAR"),
                ("last_seo_validation_at", "DATETIME"),
                ("last_seo_provider", "VARCHAR"),
                ("created_at", "DATETIME"),
                ("scheduled_at", "DATETIME"),
                ("started_at", "DATETIME"),
                ("completed_at", "DATETIME"),
                ("upload_progress", "INTEGER DEFAULT 0")
            ],
            "profiles": [
                ("description", "VARCHAR"),
                ("content_type", "VARCHAR DEFAULT 'Longform (16:9)'"),
                ("metadata_strategy", "VARCHAR DEFAULT 'Template Only'"),
                ("category", "VARCHAR"),
                ("language", "VARCHAR"),
                ("audience", "VARCHAR"),
                ("license", "VARCHAR"),
                ("thumbnail_rules", "VARCHAR"),
                ("ai_preset", "VARCHAR"),
                ("prompt_template", "VARCHAR"),
                ("is_default", "BOOLEAN DEFAULT 0"),
                ("created_at", "DATETIME"),
                ("updated_at", "DATETIME")
            ],
            "global_settings": [
                ("general_language", "VARCHAR DEFAULT 'en'"),
                ("general_theme", "VARCHAR DEFAULT 'dark'"),
                ("general_launch", "BOOLEAN DEFAULT 1"),
                ("general_update", "BOOLEAN DEFAULT 1"),
                ("upload_concurrent", "INTEGER DEFAULT 3"),
                ("upload_retry", "INTEGER DEFAULT 5"),
                ("ai_provider", "VARCHAR DEFAULT 'gemini'"),
                ("ai_api_key", "VARCHAR"),
                ("ai_base_url", "VARCHAR"),
                ("ai_model", "VARCHAR"),
                ("ai_temperature", "VARCHAR DEFAULT '0.7'"),
                ("ai_max_tokens", "INTEGER DEFAULT 2048"),
                ("ai_system_prompt", "VARCHAR"),
                ("ai_enabled", "BOOLEAN DEFAULT 1"),
                ("ai_timeout", "INTEGER DEFAULT 30"),
                ("ai_retry", "INTEGER DEFAULT 3"),
                ("notif_desktop", "BOOLEAN DEFAULT 1"),
                ("notif_sound", "BOOLEAN DEFAULT 1"),
                ("notif_success", "BOOLEAN DEFAULT 1"),
                ("notif_fail", "BOOLEAN DEFAULT 1"),
                ("perf_mode", "VARCHAR DEFAULT 'balanced'"),
                ("perf_workers", "INTEGER DEFAULT 4"),
                ("perf_threads", "INTEGER DEFAULT 8"),
                ("perf_gpu", "BOOLEAN DEFAULT 1"),
                ("perf_mem", "INTEGER DEFAULT 4096"),
                ("app_density", "VARCHAR DEFAULT 'comfortable'"),
                ("app_color", "VARCHAR DEFAULT 'cyan'"),
                ("app_anim", "BOOLEAN DEFAULT 1"),
                ("app_compact", "BOOLEAN DEFAULT 0"),
                ("adv_dev", "BOOLEAN DEFAULT 0"),
                ("adv_logs", "BOOLEAN DEFAULT 0"),
                ("updated_at", "DATETIME")
            ]
        }
        
        for table, cols in migrations.items():
            if inspector.has_table(table):
                existing = {c["name"] for c in inspector.get_columns(table)}
                for col_name, col_def in cols:
                    if col_name not in existing:
                        try:
                            db.execute(text(f"ALTER TABLE {table} ADD COLUMN {col_name} {col_def}"))
                            db.commit()
                            print(f"[DB] Auto-migrated {table}.{col_name}")
                        except Exception as e:
                            print(f"[DB Error] {e}")
                            db.rollback()
                if table == "upload_tasks":
                    try:
                        if inspector.has_table("channels") and inspector.has_table("accounts"):
                            acc_cols = set(c["name"] for c in inspector.get_columns("accounts"))
                            chn_cols = set(c["name"] for c in inspector.get_columns("channels"))
                            shared = [c for c in acc_cols if c in chn_cols and c not in ("id", "alias_name", "channel_name")]
                            
                            sel = "id, channel_name" + (", " + ", ".join(shared) if shared else "")
                            ins = "id, alias_name" + (", " + ", ".join(shared) if shared else "")
                            db.execute(text(f"INSERT OR IGNORE INTO channels ({ins}) SELECT {sel} FROM accounts WHERE id IS NOT NULL"))
                            
                            sel_rev = "id, alias_name" + (", " + ", ".join(shared) if shared else "")
                            ins_rev = "id, channel_name" + (", " + ", ".join(shared) if shared else "")
                            db.execute(text(f"INSERT OR IGNORE INTO accounts ({ins_rev}) SELECT {sel_rev} FROM channels WHERE id IS NOT NULL"))

                            for col in ["alias_name"] + shared:
                                acc_col = "channel_name" if col == "alias_name" else col
                                if acc_col in acc_cols:
                                    db.execute(text(f"UPDATE channels SET {col} = (SELECT {acc_col} FROM accounts WHERE accounts.id = channels.id) WHERE ({col} IS NULL OR {col} = '') AND EXISTS (SELECT 1 FROM accounts WHERE accounts.id = channels.id AND accounts.{acc_col} IS NOT NULL AND accounts.{acc_col} != '')"))

                            for col in ["channel_name"] + shared:
                                chn_col = "alias_name" if col == "channel_name" else col
                                if chn_col in chn_cols:
                                    db.execute(text(f"UPDATE accounts SET {col} = (SELECT {chn_col} FROM channels WHERE channels.id = accounts.id) WHERE ({col} IS NULL OR {col} = '') AND EXISTS (SELECT 1 FROM accounts WHERE accounts.id = channels.id AND accounts.{chn_col} IS NOT NULL AND accounts.{chn_col} != '')"))

                        db.execute(text("UPDATE upload_tasks SET channel_id = account_id WHERE (channel_id IS NULL OR channel_id = '') AND account_id IS NOT NULL"))
                        db.execute(text("UPDATE upload_tasks SET account_id = channel_id WHERE (account_id IS NULL OR account_id = '') AND channel_id IS NOT NULL"))
                        db.commit()
                    except Exception as e:
                        print(f"[DB Sync Notice] {e}")
                        db.rollback()
        db.close()
    except Exception as e:
        print(f"[DB Migration Error] {e}")

    print("[OAUTH]")
    print("Client Secret Architecture: Channel Specific Isolation (No Global Fallback)")

    wf_engine = get_wf_engine()
    wf_engine.start()
    
    upload_engine = get_upload_engine()
    upload_engine.start()

    scheduler_engine = get_scheduler_engine()
    scheduler_engine.start()
    
    metadata_sync_engine = get_metadata_sync_engine()
    metadata_sync_engine.start()
    
    ai_auto_engine = get_ai_automation_engine()
    ai_auto_engine.start()

    # AI Engine Health Check
    from services.ai_engine.manager import AIEngineManager
    import asyncio
    db = SessionLocal()
    try:
        try:
            asyncio.create_task(AIEngineManager.health_check(db))
        except RuntimeError:
            pass
    finally:
        db.close()


@app.on_event("shutdown")
def shutdown_event():
    """Stop the background threads cleanly."""
    scheduler_engine = get_scheduler_engine()
    scheduler_engine.stop()
    
    metadata_sync_engine = get_metadata_sync_engine()
    metadata_sync_engine.stop()

    wf_engine = get_wf_engine()
    wf_engine.stop()
    
    upload_engine = get_upload_engine()
    upload_engine.stop()
    
    ai_auto_engine = get_ai_automation_engine()
    ai_auto_engine.stop()


BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

UPLOAD_DIR = os.path.join(
    PathService.get_temp_dir(),
    "uploads"
)

THUMBNAIL_DIR = os.path.join(
    PathService.get_temp_dir(),
    "thumbnails"
)

os.makedirs(
    UPLOAD_DIR,
    exist_ok=True
)

os.makedirs(
    THUMBNAIL_DIR,
    exist_ok=True
)


from fastapi.responses import FileResponse

frontend_dist_path = os.path.join(BASE_DIR, "frontend_dist")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    if full_path.startswith("api/"):
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="API route not found")
        
    file_path = os.path.join(frontend_dist_path, full_path)
    if full_path and os.path.isfile(file_path):
        from fastapi.responses import Response
        with open(file_path, 'rb') as f:
            content = f.read()
        headers = {"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}
        return Response(content=content, media_type="text/html" if file_path.endswith(".html") else "application/javascript" if file_path.endswith(".js") else "text/css" if file_path.endswith(".css") else None, headers=headers)
        
    index_path = os.path.join(frontend_dist_path, "index.html")
    if os.path.exists(index_path):
        from fastapi.responses import Response
        with open(index_path, 'rb') as f:
            content = f.read()
        headers = {"Cache-Control": "no-cache, no-store, must-revalidate", "Pragma": "no-cache", "Expires": "0"}
        return Response(content=content, media_type="text/html", headers=headers)
        
    return {"status": "backend_running", "message": "Frontend build not found."}

# Handle health-check CLI argument (after full app, router, and SPA initialization)
if "--health-check" in sys.argv:
    print("[HEALTH] Running health check...")
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        print("[HEALTH] SQLite OK")
    except Exception as e:
        print(f"[HEALTH] SQLite failed: {e}")
        sys.exit(1)
        
    try:
        from services.license import license_service
        lic = license_service.get_status()
        print(f"[HEALTH] License Status: {lic.get('status')}")
    except Exception as e:
        print(f"[HEALTH] License module failed: {e}")
        sys.exit(1)
        
    try:
        from fastapi.testclient import TestClient
        client = TestClient(app)
        res = client.get("/")
        if res.status_code == 200:
            print("[HEALTH] SPA HTTP Endpoint OK (Status 200)")
        else:
            print(f"[HEALTH] SPA HTTP Endpoint returned status {res.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"[HEALTH] SPA HTTP Endpoint test failed: {e}")
        sys.exit(1)
        
    print("[HEALTH] All checks passed.")
    os._exit(0)

if __name__ == "__main__":
    import uvicorn
    import threading
    import sys
    import os
    import tempfile
    import webview
    import time
    import ctypes
    # Fix Windows Taskbar Icon
    try:
        myappid = 'synclimit.ryanzpitstop.app.1.0'
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(myappid)
    except Exception:
        pass
        
    # Prevent multiple instances with retry delay to allow previous process cleanup after auto-update
    mutex_name = "Global\\AutoUploader_SingleInstance_Mutex"
    mutex = None
    already_exists = True
    for _ in range(5):
        mutex = ctypes.windll.kernel32.CreateMutexW(None, False, mutex_name)
        if ctypes.windll.kernel32.GetLastError() != 183: # ERROR_ALREADY_EXISTS
            already_exists = False
            break
        time.sleep(0.5)
        
    if already_exists:
        sys.exit(0)
    
    # Redirect stdout and stderr to a file so we can see what's crashing
    log_path = os.path.join(tempfile.gettempdir(), "autouploader_crash.log")
    if sys.stdout is None:
        sys.stdout = open(log_path, "w")
    if sys.stderr is None:
        sys.stderr = open(log_path, "w")
    
    def free_port_8000():
        try:
            import subprocess
            output = subprocess.check_output('netstat -ano | findstr :8000', shell=True).decode()
            for line in output.strip().splitlines():
                if 'LISTENING' in line:
                    parts = line.strip().split()
                    pid = parts[-1] if parts else None
                    if pid and pid != str(os.getpid()) and pid != "0":
                        subprocess.run(f'taskkill /f /pid {pid}', shell=True, creationflags=subprocess.CREATE_NO_WINDOW)
        except Exception:
            pass

    def run_server():
        time.sleep(0.5)
        free_port_8000()
        for attempt in range(5):
            try:
                uvicorn.run(app, host="127.0.0.1", port=8000, log_level="error")
                break
            except Exception as e:
                time.sleep(1)
                free_port_8000()
        
    t = threading.Thread(target=run_server, daemon=True)
    t.start()
    
    # Wait for the server to be ready to prevent white screen in webview
    import urllib.request
    import time
    server_ready = False
    for _ in range(30):
        try:
            urllib.request.urlopen("http://127.0.0.1:8000", timeout=1)
            server_ready = True
            break
        except Exception:
            time.sleep(0.5)
            
    if not server_ready:
        print("Failed to start backend server in time.")
        
    from services.system.tray_service import TrayService

    tray_service_instance = None

    def show_window():
        if webview.windows:
            try:
                window = webview.windows[0]
                window.show()
                window.restore()
            except Exception as err:
                print(f"[Tray] Error showing window: {err}")

    def exit_application():
        global tray_service_instance
        if tray_service_instance:
            try:
                tray_service_instance.stop()
            except Exception:
                pass
        if webview.windows:
            try:
                webview.windows[0].destroy()
            except Exception:
                pass
        os._exit(0)

    class Api:
        def close(self):
            exit_application()
        def minimize(self):
            if webview.windows:
                webview.windows[0].minimize()
        def maximize(self):
            if webview.windows:
                webview.windows[0].toggle_fullscreen()
        def exit_app(self):
            exit_application()
        def select_files(self):
            if webview.windows:
                result = webview.windows[0].create_file_dialog(
                    webview.OPEN_DIALOG, 
                    allow_multiple=True, 
                    file_types=("Video files (*.mp4;*.mkv;*.mov;*.avi)", "All files (*.*)")
                )
                return result if result else []
            return []
        def select_folder(self):
            if webview.windows:
                result = webview.windows[0].create_file_dialog(webview.FOLDER_DIALOG)
                return result if result else []
            return []

    api = Api()
    
    # Initialize and start System Tray icon
    tray_service_instance = TrayService(
        on_show_callback=show_window,
        on_exit_callback=exit_application
    )
    tray_service_instance.start()

    import time
    url = f"http://127.0.0.1:8000/?_cb={int(time.time())}"
    window = webview.create_window(
        "Raynz PitStop", 
        url, 
        width=1200, 
        height=800,
        frameless=True,
        easy_drag=False,
        background_color='#05080e',
        js_api=api
    )
    window.events.closed += exit_application
    window.events.closing += exit_application
    webview.start()