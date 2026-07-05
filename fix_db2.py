import sqlite3
import time

conn = sqlite3.connect(r'C:\Users\Server Abal\AppData\Roaming\AutoUploader\database.db')
cursor = conn.cursor()

cursor.execute("UPDATE upload_tasks SET status='COMPLETED', completed_at=datetime('now') WHERE UPPER(status)='UPLOADING'")
conn.commit()

cursor.execute("SELECT id, title, status FROM upload_tasks")
print(cursor.fetchall())
conn.close()
