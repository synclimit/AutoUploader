import sqlite3
import time
import sys

conn = sqlite3.connect(r'C:\Users\Server Abal\AppData\Roaming\AutoUploader\database.db')
cursor = conn.cursor()

# Find an existing task to mock, or use a provided ID
cursor.execute("SELECT id FROM upload_tasks LIMIT 1")
row = cursor.fetchone()
if not row:
    print("No tasks found.")
    sys.exit()

task_id = row[0]
print(f"Mocking progress for task {task_id}")

# First set it to UPLOADING
cursor.execute("UPDATE upload_tasks SET status='UPLOADING', upload_progress=0 WHERE id=?", (task_id,))
conn.commit()

# Simulate progress 0 to 100
for i in range(0, 101, 10):
    cursor.execute("UPDATE upload_tasks SET upload_progress=? WHERE id=?", (i, task_id))
    conn.commit()
    print(f"Progress: {i}%")
    time.sleep(1)

cursor.execute("UPDATE upload_tasks SET status='COMPLETED' WHERE id=?", (task_id,))
conn.commit()
print("Done.")
conn.close()
