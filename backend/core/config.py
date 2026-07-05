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
    
    candidates = [
        Path(os.path.join(PathService.get_appdata_dir(), "client_secret.json")),
        Path(os.path.join(PathService.get_appdata_dir(), "tokens", "client_secret.json")),
    ]
    
    if getattr(sys, 'frozen', False):
        exe_dir = os.path.dirname(sys.executable)
        candidates.extend([
            Path(os.path.join(exe_dir, "client_secret.json")),
            Path(os.path.join(exe_dir, "tokens", "client_secret.json")),
            Path(os.path.join(sys._MEIPASS, "client_secret.json")),
            Path(os.path.join(sys._MEIPASS, "tokens", "client_secret.json")),
        ])
    else:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        candidates.extend([
            Path(os.path.join(base_dir, "client_secret.json")),
            Path(os.path.join(base_dir, "backend", "tokens", "client_secret.json")),
        ])
        
    for path in candidates:
        if path.exists():
            return path
            
    # Fallback default
    base_dir = sys._MEIPASS if getattr(sys, 'frozen', False) else os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    return Path(os.path.join(base_dir, "client_secret.json"))