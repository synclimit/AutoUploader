from google_auth_oauthlib.flow import InstalledAppFlow

from googleapiclient.discovery import build

from googleapiclient.http import MediaFileUpload

import pickle

import os


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

VIDEO_FILE = r"D:\AutoUploader\exports\video.mp4"


credentials = None


if os.path.exists(TOKEN_PICKLE):

    with open(
        TOKEN_PICKLE,
        "rb"
    ) as token:

        credentials = pickle.load(
            token
        )


if not credentials:

    flow = InstalledAppFlow.from_client_secrets_file(

        str(CLIENT_SECRET_PATH),

        SCOPES

    )

    credentials = flow.run_local_server(
        port=8080
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
print("START YOUTUBE UPLOAD")
print("")


request_body = {

    "snippet": {

        "title": "AUTO API TEST VIDEO",

        "description": "UPLOAD VIA YOUTUBE API",

        "tags": [
            "api",
            "test"
        ],

        "categoryId": "22"

    },

    "status": {

        "privacyStatus": "private"

    }

}


media_file = MediaFileUpload(

    VIDEO_FILE,

    chunksize=-1,

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
            f"UPLOAD PROGRESS: "
            f"{int(status.progress() * 100)}%"
        )


print("")
print("UPLOAD SUCCESS")
print("")

print(
    "VIDEO ID:",
    response["id"]
)

print("")

print(
    "YOUTUBE LINK:"
)

print(
    f"https://youtube.com/watch?v={response['id']}"
)