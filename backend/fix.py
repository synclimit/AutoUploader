import sqlite3
conn=sqlite3.connect('app_v2.db')
conn.execute("UPDATE accounts SET upload_provider='api'")
conn.commit()
