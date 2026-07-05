import sqlite3

conn = sqlite3.connect(r'C:\Users\Server Abal\AppData\Roaming\AutoUploader\database.db')
cursor = conn.cursor()

cursor.execute("UPDATE upload_tasks SET status='FAILED', failure_reason='Video is too long (YouTube 15-minute limit for unverified accounts)' WHERE UPPER(status)='UPLOADING'")
conn.commit()

cursor.execute("SELECT id, title, status FROM upload_tasks WHERE status='FAILED'")
print(cursor.fetchall())
conn.close()
