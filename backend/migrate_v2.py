import os
import sys
import json

# Add backend to path so we can import from database and models
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.db import SessionLocal
from models import Account

def run_migration():
    db = SessionLocal()
    accounts = db.query(Account).all()
    migrated = 0
    
    default_shorts = {
        "basic_info": {
            "title_template": "",
            "description": "",
            "playlist": "",
            "audience": "",
            "category": "22",
            "license": "standard",
            "ai_generated": False
        },
        "advanced": {
            "allow_comments": True,
            "show_likes": True,
            "allow_embedding": True,
            "notify_subscribers": True
        }
    }
    
    for account in accounts:
        try:
            defaults = json.loads(account.upload_defaults) if account.upload_defaults else {}
        except:
            defaults = {}
            
        # Detect legacy schema: If it doesn't have "long" or "shorts" root keys
        if "long" not in defaults and "shorts" not in defaults:
            print(f"Migrating account {account.channel_name}...")
            
            # Wrap legacy into long
            new_long = {
                "basic_info": {
                    "title_template": defaults.get("title_template", ""),
                    "description": defaults.get("description", ""),
                    "playlist": defaults.get("playlist", ""),
                    "audience": defaults.get("audience", ""),
                    "category": defaults.get("category", "22"),
                    "license": defaults.get("license", "standard"),
                    "ai_generated": defaults.get("ai_generated", False)
                },
                "advanced": {
                    "allow_comments": defaults.get("allow_comments", True),
                    "show_likes": defaults.get("show_likes", True),
                    "allow_embedding": defaults.get("allow_embedding", True),
                    "notify_subscribers": defaults.get("notify_subscribers", True)
                }
            }
            
            new_defaults = {
                "long": new_long,
                "shorts": default_shorts
            }
            
            account.upload_defaults = json.dumps(new_defaults)
            migrated += 1
            
    if migrated > 0:
        db.commit()
        print(f"Migration complete. Migrated {migrated} accounts.")
    else:
        print("No legacy configurations found. Migration skipped.")
        
    db.close()

if __name__ == "__main__":
    run_migration()
