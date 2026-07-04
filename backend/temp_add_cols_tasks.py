import sqlite3

def add_columns():
    conn = sqlite3.connect('app_v2.db')
    cursor = conn.cursor()
    
    cols = [
        "pipeline_type TEXT",
        "schedule_mode TEXT",
        "schedule_time TEXT",
        "humanize_enabled BOOLEAN DEFAULT 0",
        "humanize_min INTEGER DEFAULT 0",
        "humanize_max INTEGER DEFAULT 0",
    ]
    
    for col in cols:
        try:
            cursor.execute(f"ALTER TABLE upload_tasks ADD COLUMN {col}")
            print(f"Added {col}")
        except Exception as e:
            print(f"Failed to add {col}: {e}")
            
    conn.commit()
    conn.close()

if __name__ == '__main__':
    add_columns()
