import sqlite3
import time

conn = sqlite3.connect(r'C:\Users\Server Abal\AppData\Roaming\AutoUploader\database.db')
cursor = conn.cursor()

# Get the uploading tasks
cursor.execute("SELECT id, title, status FROM upload_tasks WHERE status='uploading'")
tasks = cursor.fetchall()
print("Uploading tasks:", tasks)

for t in tasks:
    task_id = t[0]
    # We will update it to COMPLETED because it's already on YouTube
    cursor.execute("UPDATE upload_tasks SET status='completed', completed_at=datetime('now') WHERE id=?", (task_id,))
    
    # We also need to add a log entry to indicate it was manually completed
    cursor.execute("INSERT INTO upload_logs (task_id, status, message, created_at) VALUES (?, 'completed', 'Manually marked as completed (already uploaded)', datetime('now'))", (task_id,))

if tasks:
    conn.commit()
    print("Tasks successfully marked as completed in DB!")
else:
    print("No stuck tasks found.")

conn.close()
