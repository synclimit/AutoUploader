import os
from database.db import get_db, SessionLocal
from services.watch_folder import validator
import json

folder = "test_import_pkg_no_meta"
os.makedirs(folder, exist_ok=True)
with open(os.path.join(folder, "video.mp4"), "w") as f:
    f.write("dummy")

res = validator.validate(folder)
print("SUCCESS:", res.success)
print("ERROR:", res.error_code, res.error_message)
