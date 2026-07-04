from dotenv import load_dotenv
import os

load_dotenv()

APP_NAME = os.getenv("APP_NAME")
APP_ENV = os.getenv("APP_ENV")

APP_HOST = os.getenv("APP_HOST")
APP_PORT = os.getenv("APP_PORT")

DATABASE_URL = os.getenv("DATABASE_URL")

REDIS_HOST = os.getenv("REDIS_HOST")
REDIS_PORT = os.getenv("REDIS_PORT")

from pathlib import Path
import os
import sys

def get_client_secret_path() -> Path:
    from services.system.path_service import PathService
    
    # 1. Check in AppData
    appdata_secret = Path(os.path.join(PathService.get_appdata_dir(), "client_secret.json"))
    if appdata_secret.exists():
        return appdata_secret
        
    # 2. Check in EXE directory (if frozen)
    if getattr(sys, 'frozen', False):
        exe_secret = Path(os.path.join(os.path.dirname(sys.executable), "client_secret.json"))
        if exe_secret.exists():
            return exe_secret
            
    # 3. Fallback to default developer dir
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if getattr(sys, 'frozen', False):
        base_dir = sys._MEIPASS
    return Path(os.path.join(base_dir, "client_secret.json"))