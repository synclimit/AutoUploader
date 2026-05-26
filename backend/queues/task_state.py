from queues.redis_client import redis_client
import json


def set_task_state(video_id, data):

    key = f"task:{video_id}"

    redis_client.set(
        key,
        json.dumps(data)
    )


def get_task_state(video_id):

    key = f"task:{video_id}"

    data = redis_client.get(key)

    if data:
        return json.loads(data)

    return None