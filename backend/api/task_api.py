from fastapi import APIRouter
from database.db import SessionLocal
from database.models import UploadTask


router = APIRouter()


@router.get("/tasks")


def get_tasks():

    db = SessionLocal()

    tasks = db.query(UploadTask).all()

    result = []

    for task in tasks:

        result.append({
            "video_id": task.video_id,
            "title": task.title,
            "platform": task.platform,
            "status": task.status
        })

    db.close()

    return result