from apscheduler.schedulers.background import BackgroundScheduler
from queues.upload_queue import add_upload_task
import time
import uuid


scheduler = BackgroundScheduler()


def scheduled_upload():

    task = {
        "video_id": str(uuid.uuid4()),
        "title": "Auto Scheduled Upload",
        "platform": "YouTube",
        "status": "waiting"
    }

    add_upload_task(task)

    print("SCHEDULED TASK SENT")


scheduler.add_job(
    scheduled_upload,
    "interval",
    seconds=15
)


def start_scheduler():

    scheduler.start()

    print("SCHEDULER STARTED")

    try:
        while True:
            time.sleep(1)

    except KeyboardInterrupt:
        scheduler.shutdown()