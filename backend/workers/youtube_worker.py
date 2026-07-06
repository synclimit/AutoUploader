from google_auth_oauthlib.flow import InstalledAppFlow

from googleapiclient.discovery import build

from googleapiclient.http import MediaFileUpload

import pickle

import os

import time

import traceback


from database.db import SessionLocal

from models import UploadTask


SCOPES = [
    "https://www.googleapis.com/auth/youtube.upload"
]


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

TOKENS_DIR = os.path.join(
    BASE_DIR,
    "tokens"
)

import sys
sys.path.append(BASE_DIR)
from core.config import CLIENT_SECRET_PATH

TOKEN_PICKLE = os.path.join(
    TOKENS_DIR,
    "youtube_token.pickle"
)


print("")
print("STARTING YOUTUBE WORKER")
print("")


credentials = None


try:

    if os.path.exists(TOKEN_PICKLE):

        print("TOKEN FOUND")

        with open(
            TOKEN_PICKLE,
            "rb"
        ) as token:

            credentials = pickle.load(
                token
            )

    if not credentials:

        print("LOGIN REQUIRED")

        flow = InstalledAppFlow.from_client_secrets_file(

            str(CLIENT_SECRET_PATH),

            SCOPES

        )

        credentials = flow.run_local_server(
            port=8080,
            prompt='select_account'
        )

        with open(
            TOKEN_PICKLE,
            "wb"
        ) as token:

            pickle.dump(
                credentials,
                token
            )

    youtube = build(
        "youtube",
        "v3",
        credentials=credentials
    )

    print("")
    print("YOUTUBE LOGIN SUCCESS")
    print("")

except Exception as e:

    print("")
    print("LOGIN ERROR")
    print(str(e))
    print("")

    traceback.print_exc()

    exit()


while True:

    try:
        db = SessionLocal()

        print("")
        print("CHECKING QUEUE...")
        print("")

        from schemas import QueueStatusEnum
        queued_task = db.query(UploadTask).filter(UploadTask.status == QueueStatusEnum.queued).first()

        if queued_task:
            
            print("")
            print(f"FOUND TASK: {queued_task.id}")
            print("")
            
            queued_task.status = "processing"

            db.commit()

            request_body = {

                "snippet": {

                    "title": queued_task.title,

                    "description": queued_task.description,

                    "categoryId": "22"

                },

                "status": {

                    "privacyStatus": queued_task.visibility

                }

            }

            media_file = MediaFileUpload(

                queued_task.video_path,

                resumable=True

            )

            request = youtube.videos().insert(

                part="snippet,status",

                body=request_body,

                media_body=media_file

            )

            response = None

            while response is None:

                status, response = request.next_chunk()

                if status:

                    print(
                        f"UPLOAD: "
                        f"{int(status.progress() * 100)}%"
                    )

            if queued_task.thumbnail_path:

                youtube.thumbnails().set(

                    videoId=response["id"],

                    media_body=MediaFileUpload(
                        queued_task.thumbnail_path
                    )

                ).execute()

                print("")
                print("THUMBNAIL UPLOADED")
                print("")

            queued_task.status = "finished"

            db.commit()

            print("")
            print("UPLOAD FINISHED")
            print("")

        db.close()

    except Exception as e:

        print("")
        print("WORKER ERROR")
        print(str(e))
        print("")

        traceback.print_exc()

    time.sleep(5)