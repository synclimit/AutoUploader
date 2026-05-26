from database.db import SessionLocal
from database.models import UploadTask


def save_upload_task(task_data):

    db = SessionLocal()

    task = UploadTask(
        video_id=task_data["video_id"],
        title=task_data["title"],
        platform=task_data["platform"],
        status=task_data["status"]
    )

    db.add(task)

    db.commit()

    db.close()

    print("TASK SAVED TO DATABASE")