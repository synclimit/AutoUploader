import sqlite3
import sys
db_path = "D:\\AutoUploader\\auto_uploader.db"
try:
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT id, title, status, ai_metadata_generated FROM upload_tasks WHERE title LIKE '%M5_INTERRUPT_6%'")
    tasks = cur.fetchall()
    print("Tasks:", tasks)
    
    if tasks:
        task_id = tasks[0][0]
        cur.execute("SELECT message FROM upload_logs WHERE task_id = ? ORDER BY id DESC LIMIT 5", (task_id,))
        logs = cur.fetchall()
        print("Logs:", logs)
    
except Exception as e:
    print("Error:", e)
