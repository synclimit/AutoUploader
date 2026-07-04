import sqlite3

def add_columns():
    db_name = 'app_v2.db'
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    
    cols = [
        "upload_mode TEXT DEFAULT 'Waiting For Approval'",
        "ai_metadata_generated BOOLEAN DEFAULT 0",
    ]
    
    for col in cols:
        try:
            cursor.execute(f"ALTER TABLE upload_tasks ADD COLUMN {col}")
            print(f"Added {col} to upload_tasks in {db_name}")
        except Exception as e:
            print(f"Failed to add {col}: {e}")
            
    conn.commit()
    conn.close()

if __name__ == '__main__':
    add_columns()
