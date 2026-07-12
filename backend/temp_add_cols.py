import sqlite3

def add_columns():
    conn = sqlite3.connect('app_v2.db')
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE channels ADD COLUMN pipelines TEXT DEFAULT '{}'")
        print("Added pipelines")
    except Exception as e:
        print(e)
        
    try:
        cursor.execute("ALTER TABLE channels ADD COLUMN pipeline_states TEXT DEFAULT '{}'")
        print("Added pipeline_states")
    except Exception as e:
        print(e)
        
    conn.commit()
    conn.close()

if __name__ == '__main__':
    add_columns()
