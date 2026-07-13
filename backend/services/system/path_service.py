import os
import shutil
import sys

class PathService:
    @staticmethod
    def get_appdata_dir() -> str:
        """Get the root AppData directory for AutoUploader."""
        appdata = os.environ.get('APPDATA')
        if appdata:
            base_dir = os.path.join(appdata, 'AutoUploader')
        else:
            # Fallback for systems where APPDATA is not set
            base_dir = os.path.join(os.path.expanduser('~'), '.autouploader')
            
        os.makedirs(base_dir, exist_ok=True)
        return base_dir
        
    @staticmethod
    def get_database_path() -> str:
        return os.path.join(PathService.get_appdata_dir(), "database.db")
        
    @staticmethod
    def get_settings_path() -> str:
        return os.path.join(PathService.get_appdata_dir(), "settings.json")
        
    @staticmethod
    def get_license_path() -> str:
        return os.path.join(PathService.get_appdata_dir(), "license.lic")
        
    @staticmethod
    def get_public_key_path() -> str:
        """Public key usually ships with the executable, so it might be local."""
        import sys
        if getattr(sys, 'frozen', False):
            # In a one-folder PyInstaller bundle, sys._MEIPASS points to the bundle folder
            base_dir = sys._MEIPASS
        else:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        return os.path.join(base_dir, "services", "license", "keys", "public.pem")
        
    @staticmethod
    def get_logs_dir() -> str:
        d = os.path.join(PathService.get_appdata_dir(), "logs")
        os.makedirs(d, exist_ok=True)
        return d
        
    @staticmethod
    def get_cache_dir() -> str:
        d = os.path.join(PathService.get_appdata_dir(), "cache")
        os.makedirs(d, exist_ok=True)
        return d
        
    @staticmethod
    def get_exports_dir() -> str:
        d = os.path.join(PathService.get_appdata_dir(), "exports")
        os.makedirs(d, exist_ok=True)
        return d
        
    @staticmethod
    def get_workspace_dir() -> str:
        d = os.path.join(PathService.get_appdata_dir(), "workspace")
        os.makedirs(d, exist_ok=True)
        return d
        
    @staticmethod
    def get_backup_dir() -> str:
        d = os.path.join(PathService.get_appdata_dir(), "backup")
        os.makedirs(d, exist_ok=True)
        return d

    @staticmethod
    def get_temp_dir() -> str:
        d = os.path.join(PathService.get_appdata_dir(), "temp")
        os.makedirs(d, exist_ok=True)
        return d

    @staticmethod
    def perform_first_run_migration():
        """
        Migrates database, settings, license, and workspace from the old local directory
        to the new AppData directory. This runs transactionally (mostly safe copies).
        """
        appdata_dir = PathService.get_appdata_dir()
        
        # Local paths (old setup)
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        local_db = os.path.join(base_dir, "app_v2.db")
        local_settings = os.path.join(base_dir, "settings.json")
        local_license = os.path.join(base_dir, "license.lic")
        local_workspace = os.path.join(base_dir, "workspace")
        
        # AppData paths (new setup)
        appdata_db = PathService.get_database_path()
        appdata_settings = PathService.get_settings_path()
        appdata_license = PathService.get_license_path()
        appdata_workspace = PathService.get_workspace_dir()
        
        migration_occurred = False
        
        local_db = os.path.join(base_dir, "app_v2.db")
        backend_db = os.path.join(base_dir, "backend", "app_v2.db")
        appdata_db = PathService.get_database_path()

        # If it doesn't exist, or it's an empty shell created by SQLAlchemy (< 10KB)
        is_empty = os.path.exists(appdata_db) and os.path.getsize(appdata_db) < 10000
        source_db = local_db if os.path.exists(local_db) else (backend_db if os.path.exists(backend_db) else None)
        
        if (not os.path.exists(appdata_db) or is_empty) and source_db:
            print(f"[MIGRATION] Copying local database to AppData: {appdata_db}")
            try:
                shutil.copy2(source_db, appdata_db)
                migration_occurred = True
            except Exception as e:
                print(f"[MIGRATION ERROR] Failed to copy database: {e}")
                
            # Migrate Settings
            if os.path.exists(local_settings) and not os.path.exists(appdata_settings):
                try:
                    shutil.copy2(local_settings, appdata_settings)
                except Exception as e:
                    print(f"[MIGRATION ERROR] Failed to copy settings: {e}")
                    
            # Migrate License
            if os.path.exists(local_license) and not os.path.exists(appdata_license):
                try:
                    shutil.copy2(local_license, appdata_license)
                except Exception as e:
                    print(f"[MIGRATION ERROR] Failed to copy license: {e}")

            # Migrate Tokens folder
            appdata_tokens = os.path.join(appdata_dir, "tokens")
            local_tokens = os.path.join(base_dir, "tokens") if os.path.exists(os.path.join(base_dir, "tokens")) else os.path.join(base_dir, "backend", "tokens")
            if os.path.exists(local_tokens) and not os.path.exists(appdata_tokens):
                try:
                    shutil.copytree(local_tokens, appdata_tokens, dirs_exist_ok=True)
                except Exception as e:
                    print(f"[MIGRATION ERROR] Failed to copy tokens: {e}")
                    
            # Workspace migration can be large, we might just copy if it's small or just let it start fresh
            if os.path.exists(local_workspace) and not os.listdir(appdata_workspace):
                try:
                    shutil.copytree(local_workspace, appdata_workspace, dirs_exist_ok=True)
                except Exception as e:
                    print(f"[MIGRATION ERROR] Failed to copy workspace: {e}")

        # Always ensure client_secret.json is in AppData
        appdata_secret = os.path.join(appdata_dir, "client_secret.json")
        local_secret = os.path.join(base_dir, "client_secret.json")
        if getattr(sys, 'frozen', False):
            # Check MEIPASS first (if bundled)
            meipass_secret = os.path.join(sys._MEIPASS, "client_secret.json")
            if os.path.exists(meipass_secret):
                local_secret = meipass_secret
            else:
                # Check next to the .exe
                exe_dir_secret = os.path.join(os.path.dirname(sys.executable), "client_secret.json")
                if os.path.exists(exe_dir_secret):
                    local_secret = exe_dir_secret
                    
        if os.path.exists(local_secret) and not os.path.exists(appdata_secret):
            try:
                shutil.copy2(local_secret, appdata_secret)
                print(f"[MIGRATION] Copied client_secret.json to AppData: {appdata_secret}")
            except Exception as e:
                print(f"[MIGRATION ERROR] Failed to copy client_secret: {e}")

        if migration_occurred:
            print("[MIGRATION] First-run data migration completed successfully.")
