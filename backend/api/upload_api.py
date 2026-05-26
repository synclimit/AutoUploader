from fastapi import APIRouter
from queues.upload_queue import add_upload_task
import uuid


router = APIRouter()


@router.post("/upload")


def create_upload():

    task = {
        "video_id": str(uuid.uuid4()),
        "title": "Manual Upload",
        "platform": "YouTube",
        "status": "waiting"
    }

    add_upload_task(task)

    return {
        "message": "UPLOAD TASK CREATED",
        "task": task
    }