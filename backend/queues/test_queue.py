from queues.upload_queue import (
    add_upload_task,
    get_upload_task
)

sample_task = {
    "video_id": "DJ001",
    "title": "DJ Remix Viral",
    "platform": "TikTok",
    "status": "waiting"
}

add_upload_task(sample_task)

task = get_upload_task()

print("QUEUE RESULT:")
print(task)