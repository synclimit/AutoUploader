from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File, Form

import shutil
import uuid
import os
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

TASKS_FILE = os.path.join(
    BASE_DIR,
    "storage",
    "tasks.json"
)


def load_tasks():

    with open(TASKS_FILE, "r") as file:

        return json.load(file)


def save_tasks(tasks):

    with open(TASKS_FILE, "w") as file:

        json.dump(tasks, file, indent=2)


@app.get("/")
def home():

    return {
        "message": "AUTOUPLOADER BACKEND RUNNING"
    }


@app.get("/tasks")
def get_tasks():

    return load_tasks()


@app.post("/upload")
async def create_upload(

    title: str = Form(...),
    platform: str = Form(...),

    video: UploadFile = File(...),
    thumbnail: UploadFile = File(...)

):

    tasks = load_tasks()

    video_id = str(uuid.uuid4())

    video_ext = video.filename.split(".")[-1]
    thumb_ext = thumbnail.filename.split(".")[-1]

    video_filename = f"{video_id}.{video_ext}"
    thumb_filename = f"{video_id}.{thumb_ext}"

    video_path = os.path.join(
        BASE_DIR,
        "storage",
        "videos",
        video_filename
    )

    thumb_path = os.path.join(
        BASE_DIR,
        "storage",
        "thumbnails",
        thumb_filename
    )

    with open(video_path, "wb") as buffer:

        shutil.copyfileobj(
            video.file,
            buffer
        )

    with open(thumb_path, "wb") as buffer:

        shutil.copyfileobj(
            thumbnail.file,
            buffer
        )

    new_task = {
        "video_id": video_id,
        "title": title,
        "platform": platform,
        "status": "waiting",
        "video_file": video_filename,
        "thumbnail_file": thumb_filename
    }

    tasks.append(new_task)

    save_tasks(tasks)

    return {
        "message": "UPLOAD CREATED",
        "task": new_task
    }