from queues.redis_client import redis_client
import json

QUEUE_NAME = "upload_queue"


def add_upload_task(task_data):

    redis_client.rpush(
        QUEUE_NAME,
        json.dumps(task_data)
    )

    print("TASK ADDED")


def get_upload_task():

    task = redis_client.lpop(QUEUE_NAME)

    if task:
        return json.loads(task)

    return None