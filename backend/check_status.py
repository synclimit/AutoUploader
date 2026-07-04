import sqlite3
conn = sqlite3.connect('app_v2.db')
print(conn.execute("SELECT status, started_at, completed_at, failure_reason FROM upload_tasks WHERE id='c658296a-4a60-4b15-b5b4-aae2373a1be3'").fetchone())
