from fastapi import FastAPI
from fastapi import UploadFile
from fastapi import File
from fastapi import Form

import shutil
import os
import sys
import logging

from datetime import datetime

from services.system.path_service import PathService

# 1. Migrate paths if this is the first run before DB binds
PathService.perform_first_run_migration()

# 2. Handle health-check CLI argument
if "--health-check" in sys.argv:
    print("[HEALTH] Running health check...")
    try:
        from database.db import SessionLocal
        from sqlalchemy import text
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
        
    print("[HEALTH] All checks passed.")
    sys.exit(0)

from database.db import engine
from database.db import SessionLocal
from models import Base
from models import UploadTask
from fastapi.middleware.cors import CORSMiddleware
from api.profiles import router as profiles_router
from api.channels import router as accounts_router
from api.queue import router as queue_router
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
    """Start the background threads."""
    try:
        from database.db import SessionLocal, engine
        from sqlalchemy import text, inspect
        db = SessionLocal()
        inspector = inspect(engine)
        
        migrations = {
            "channels": [
                ("avatar_url", "VARCHAR"),
                ("subscribers", "VARCHAR"),
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
                ("import_folder", "VARCHAR"),
                ("browser_profile", "VARCHAR"),
                ("metadata_profile", "VARCHAR"),
                ("upload_preset", "VARCHAR"),
                ("playlist", "VARCHAR"),
                ("schema_version", "INTEGER DEFAULT 1")
            ],
            "upload_tasks": [
                ("ai_use", "BOOLEAN DEFAULT 0"),
                ("default_language", "VARCHAR"),
                ("audio_language", "VARCHAR"),
                ("recording_date", "VARCHAR"),
                ("last_seo_validation_at", "DATETIME"),
                ("last_seo_provider", "VARCHAR"),
                ("notify_subscribers", "BOOLEAN DEFAULT 1"),
                ("embeddable", "BOOLEAN DEFAULT 1"),
                ("public_stats_viewable", "BOOLEAN DEFAULT 1"),
                ("failure_reason", "VARCHAR"),
                ("youtube_video_id", "VARCHAR"),
                ("youtube_url", "VARCHAR"),
                ("playlist_id", "VARCHAR"),
                ("playlist_title", "VARCHAR"),
                ("category_id", "INTEGER"),
                ("license", "VARCHAR"),
                ("audience", "VARCHAR"),
                ("pipeline_type", "VARCHAR"),
                ("schedule_mode", "VARCHAR"),
                ("schedule_time", "VARCHAR"),
                ("humanize_enabled", "BOOLEAN DEFAULT 0"),
                ("humanize_min", "INTEGER DEFAULT 0"),
                ("humanize_max", "INTEGER DEFAULT 0"),
                ("upload_mode", "VARCHAR DEFAULT 'Waiting For Approval'"),
                ("ai_metadata_generated", "BOOLEAN DEFAULT 0"),
                ("retry_count", "INTEGER DEFAULT 0"),
                ("created_at", "DATETIME"),
                ("scheduled_at", "DATETIME"),
                ("started_at", "DATETIME"),
                ("completed_at", "DATETIME"),
                ("upload_progress", "INTEGER DEFAULT 0")
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
        db.close()
    except Exception as e:
        print(f"[DB Migration Error] {e}")

    from core.config import get_client_secret_path
    print("[OAUTH]")
    print("Client Secret:")
    try:
        print(str(get_client_secret_path()))
    except Exception as e:
        print(f"Error getting secret path: {e}")

    wf_engine = get_wf_engine()
    wf_engine.start()
    
    upload_engine = get_upload_engine()
    upload_engine.start()

    scheduler_engine = get_scheduler_engine()
    scheduler_engine.start()
    
    ai_auto_engine = get_ai_automation_engine()
    ai_auto_engine.start()

    # AI Engine Health Check
    from services.ai_engine.manager import AIEngineManager
    import asyncio
    db = SessionLocal()
    try:
        asyncio.create_task(AIEngineManager.health_check(db))
    finally:
        db.close()


@app.on_event("shutdown")
def shutdown_event():
    """Stop the background threads cleanly."""
    scheduler_engine = get_scheduler_engine()
    scheduler_engine.stop()

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
        
    # Prevent multiple instances
    mutex_name = "Global\\AutoUploader_SingleInstance_Mutex"
    mutex = ctypes.windll.kernel32.CreateMutexW(None, False, mutex_name)
    if ctypes.windll.kernel32.GetLastError() == 183: # ERROR_ALREADY_EXISTS
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
        
    class Api:
        def close(self):
            if webview.windows:
                webview.windows[0].destroy()
        def minimize(self):
            if webview.windows:
                webview.windows[0].minimize()
        def maximize(self):
            if webview.windows:
                webview.windows[0].toggle_fullscreen()

    api = Api()
    import time
    url = f"http://127.0.0.1:8000/?_cb={int(time.time())}"
    webview.create_window(
        "Ryanz Pitstop", 
        url, 
        width=1200, 
        height=800,
        frameless=True,
        easy_drag=False,
        background_color='#05080e',
        js_api=api
    )
    webview.start()