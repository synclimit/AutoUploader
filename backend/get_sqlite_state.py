import sqlite3, json
import os

conn = sqlite3.connect(os.path.join(os.path.dirname(__file__), 'app_v2.db'))
c = conn.cursor()

def get_count(query):
    c.execute(query)
    return c.fetchone()[0]

state = {
    "Connected": get_count("SELECT count(*) FROM channels"), 
    "Pending": get_count("SELECT count(*) FROM upload_tasks WHERE status='REVIEW'"),
    "Uploading": get_count("SELECT count(*) FROM upload_tasks WHERE status='UPLOADING'"),
    "Completed": get_count("SELECT count(*) FROM upload_tasks WHERE status='COMPLETED'"),
    "Failed": get_count("SELECT count(*) FROM upload_tasks WHERE status='FAILED'"),
    "Attention": get_count("SELECT count(*) FROM upload_tasks WHERE status='REVIEW' or status='FAILED'")
}
print(json.dumps(state))
