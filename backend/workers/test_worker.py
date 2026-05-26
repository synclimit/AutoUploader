from queues.upload_queue import add_upload_task

sample_task = {
    "video_id": "YT001",
    "title": "DJ Slow Bass Viral",
    "platform": "YouTube",
    "status": "waiting"
}

add_upload_task(sample_task)

print("TEST TASK SENT")