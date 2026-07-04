import sqlite3

try:
    conn = sqlite3.connect("database.db")
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE accounts ADD COLUMN subscribers VARCHAR;")
    conn.commit()
    print("Column added successfully.")
except Exception as e:
    print(f"Error: {e}")
finally:
    conn.close()
