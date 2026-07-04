import os
import sys
import json
from datetime import datetime
from database.db import SessionLocal
from models import Account, UploadTask
from services.watch_folder import scanner, validator, duplicate_checker

def debug_channel(channel_name: str):
    print("==============================")
    print("WATCH FOLDER TRACE")
    print("==============================\n")
    
    db = SessionLocal()
    account = db.query(Account).filter(Account.channel_name == channel_name).first()
    
    if not account:
        print(f"[FAIL] Channel Loaded\n")
        print("Reason:")
        print(f"Account {channel_name} not found.")
        print("\n==============================")
        print("TRACE COMPLETE")
        print("==============================")
        db.close()
        return
        
    print("[PASS] Channel Loaded")
        
    try:
        pipelines = json.loads(account.pipelines) if account.pipelines else {}
    except:
        pipelines = {}
        
    if not pipelines and account.watch_folder_enabled and account.watch_folder:
        pipelines = {
            "long": {
                "enabled": True,
                "watch_folder": account.watch_folder,
                "daily_limit": 2,
                "processing_order": "oldest_first",
                "schedule_mode": "application",
                "schedule": ["09:00", "18:00"],
                "publish_mode": account.publish_visibility or "private",
                "retry_failed": True,
                "duplicate_policy": "skip"
            }
        }
        
    if not pipelines:
        print("\n[FAIL] Configuration\n")
        print("Reason:")
        print("Pipeline JSON not found.")
        print("\n==============================")
        print("TRACE COMPLETE")
        print("==============================")
        db.close()
        return

    for p_key, p_config in pipelines.items():
        enabled = p_config.get("enabled", False)
        if not enabled:
            continue
            
        print(f"[PASS] Pipeline {p_key.upper()} Enabled")
            
        folder = p_config.get("watch_folder")
        if folder and os.path.isdir(folder):
            print("[PASS] Folder Exists")
            print("[PASS] Folder Accessible")
        else:
            print("\n[FAIL] Folder Exists\n")
            print("Reason:")
            print(f"Folder not found or empty path: {folder}")
            print("\n==============================")
            print("TRACE COMPLETE")
            print("==============================")
            db.close()
            return
            
        candidates, path_ok = scanner.scan(folder)
        if path_ok:
            print(f"\n[PASS] Files Found : {len(candidates)}\n")
            if candidates:
                c_path = candidates[0] if isinstance(candidates[0], str) else candidates[0].get("path")
                print("Video:")
                print(os.path.basename(c_path) + "\n")
                
                res = validator.validate(c_path)
                if not res.success:
                    print("[FAIL] Package Validation\n")
                    print("Reason:")
                    err = res.error_code if res.error_code else "Single MP4 is not a valid package."
                    # Map common error
                    if err == "MISSING_METADATA":
                        err = "Single MP4 is not a valid package."
                    print(err)
                else:
                    dup = duplicate_checker.check(res.video_id, c_path, db)
                    if dup.is_duplicate:
                        print("[FAIL] Package Validation\n")
                        print("Reason:")
                        print("Duplicate package.")
                    else:
                        try:
                            from services.watch_folder import importer
                            task = importer.create_task(res, account, db, p_key, p_config)
                            print("[PASS] Import\n")
                            print("Reason:")
                            print(f"UploadTask created successfully: {task.id}")
                        except Exception as e:
                            print("[FAIL] Import\n")
                            print("Reason:")
                            print(f"UploadTask creation failed: {e}")
        else:
            print("[FAIL] Folder Accessible\n")
            print("Reason:")
            print("Scanner could not access path.")
            
        break # Only process first active pipeline based on output format

    print("\n==============================")
    print("TRACE COMPLETE")
    print("==============================")
    db.close()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        debug_channel(sys.argv[1])
    else:
        print("Usage: python watch_folder_debug.py <Channel Name>")
