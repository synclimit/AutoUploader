import time
import json
import os

BASE_DIR = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
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


print("UPLOAD WORKER STARTED")


while True:

    tasks = load_tasks()

    waiting_tasks = [
        task for task in tasks
        if task["status"] == "waiting"
    ]

    if len(waiting_tasks) == 0:

        print("QUEUE EMPTY...")

        time.sleep(3)

        continue


    current_task = waiting_tasks[0]

    current_task["status"] = "processing"

    save_tasks(tasks)

    print("")
    print("PROCESSING TASK")
    print(current_task["title"])

    time.sleep(5)

    current_task["status"] = "uploaded"

    save_tasks(tasks)

    print("UPLOAD COMPLETE")
    print("")

    time.sleep(2)