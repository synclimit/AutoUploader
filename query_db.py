import sqlite3
import sys

def main():
    conn = sqlite3.connect('app_v2.db')
    cursor = conn.cursor()
    cursor.execute("SELECT id, video_path, status FROM upload_tasks WHERE video_path LIKE '%f.mp4%'")
    rows = cursor.fetchall()
    print("f.mp4 rows:", rows)
    conn.close()

if __name__ == "__main__":
    main()
