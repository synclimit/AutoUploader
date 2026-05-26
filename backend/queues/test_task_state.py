from queues.task_state import get_task_state

video_id = "c8290749-29ee-4c93-b03b-dd89a0d75367"

state = get_task_state(video_id)

print("TASK STATE:")
print(state)