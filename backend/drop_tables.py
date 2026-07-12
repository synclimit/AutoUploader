import sqlite3
import os
from services.system.path_service import PathService

db_path = PathService.get_database_path()
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()
for t in tables:
    if t[0] != 'sqlite_sequence':
        conn.execute(f'DROP TABLE IF EXISTS "{t[0]}"')
conn.commit()
conn.close()
print("All tables dropped.")
