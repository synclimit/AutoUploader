import os
from database.db import get_db, SessionLocal
from services.watch_folder import validator, duplicate_checker, importer
from models import Channel
import json

db = SessionLocal()
channel = db.query(Channel).first()

folder = "test_import_pkg"
os.makedirs(folder, exist_ok=True)
with open(os.path.join(folder, "video.mp4"), "w") as f:
    f.write("dummy")

with open(os.path.join(folder, "metadata.json"), "w") as f:
    json.dump({"title_final": "test", "video_id": "test_id"}, f)

result = validator.validate(folder)
try:
    p_config = {
        "processing_order": "oldest_first",
        "schedule_mode": "manual",
        "retry_failed": True,
        "duplicate_policy": "skip"
    }
    task = importer.create_task(result, channel, db, "manual_import", p_config)
    print("SUCCESS, task ID:", task.id)
except Exception as e:
    import traceback
    traceback.print_exc()
