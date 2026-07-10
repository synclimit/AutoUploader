import sqlite3
import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from services.system.path_service import PathService

def column_exists(cursor, table, column):
    cursor.execute(f"PRAGMA table_info({table})")
    columns = [row[1] for row in cursor.fetchall()]
    return column in columns

def migrate():
    db_path = PathService.get_database_path()
    print(f"Migrating {db_path}...")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # UploadTask additions
    table = "upload_tasks"
    try:
        if not column_exists(cursor, table, "upload_stage"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN upload_stage VARCHAR NOT NULL DEFAULT 'NONE'")
            print(f"Added upload_stage to {table}")
        if not column_exists(cursor, table, "metadata_source"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN metadata_source VARCHAR NOT NULL DEFAULT 'MANUAL'")
            print(f"Added metadata_source to {table}")
        if not column_exists(cursor, table, "source_type"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN source_type VARCHAR NOT NULL DEFAULT 'MANUAL_UPLOAD'")
            print(f"Added source_type to {table}")
        if not column_exists(cursor, table, "source_id"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN source_id VARCHAR")
            print(f"Added source_id to {table}")
        if not column_exists(cursor, table, "execution_source"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN execution_source VARCHAR")
            print(f"Added execution_source to {table}")
        if not column_exists(cursor, table, "correlation_id"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN correlation_id VARCHAR")
            print(f"Added correlation_id to {table}")
        if not column_exists(cursor, table, "execution_no"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN execution_no INTEGER")
            print(f"Added execution_no to {table}")
    except Exception as e:
        print(f"Error in {table}: {e}")

    # CampaignUploadPlan additions
    table = "campaign_upload_plans"
    try:
        if not column_exists(cursor, table, "correlation_id"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN correlation_id VARCHAR")
            print(f"Added correlation_id to {table}")
        if not column_exists(cursor, table, "execution_no"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN execution_no INTEGER NOT NULL DEFAULT 0")
            print(f"Added execution_no to {table}")
        if not column_exists(cursor, table, "attempt"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN attempt INTEGER NOT NULL DEFAULT 1")
            print(f"Added attempt to {table}")
        if not column_exists(cursor, table, "failure_category"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN failure_category VARCHAR")
            print(f"Added failure_category to {table}")
        if not column_exists(cursor, table, "retry_policy"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN retry_policy VARCHAR NOT NULL DEFAULT 'MANUAL'")
            print(f"Added retry_policy to {table}")
    except Exception as e:
        print(f"Error in {table}: {e}")

    # CampaignUploadJournal additions
    table = "campaign_upload_journal"
    try:
        if not column_exists(cursor, table, "source_id"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN source_id VARCHAR")
            print(f"Added source_id to {table}")
        if not column_exists(cursor, table, "correlation_id"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN correlation_id VARCHAR")
            print(f"Added correlation_id to {table}")
        if not column_exists(cursor, table, "execution_no"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN execution_no INTEGER")
            print(f"Added execution_no to {table}")
        if not column_exists(cursor, table, "attempt"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN attempt INTEGER")
            print(f"Added attempt to {table}")
        if not column_exists(cursor, table, "browser_profile"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN browser_profile VARCHAR")
            print(f"Added browser_profile to {table}")
        if not column_exists(cursor, table, "result"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN result VARCHAR NOT NULL DEFAULT 'UNKNOWN'")
            print(f"Added result to {table}")
        if not column_exists(cursor, table, "duration_ms"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN duration_ms INTEGER")
            print(f"Added duration_ms to {table}")
        if not column_exists(cursor, table, "failure_category"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN failure_category VARCHAR")
            print(f"Added failure_category to {table}")
        if not column_exists(cursor, table, "failure_reason"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN failure_reason VARCHAR")
            print(f"Added failure_reason to {table}")
        if not column_exists(cursor, table, "started_at"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN started_at DATETIME")
            print(f"Added started_at to {table}")
        if not column_exists(cursor, table, "finished_at"):
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN finished_at DATETIME")
            print(f"Added finished_at to {table}")
    except Exception as e:
        print(f"Error in {table}: {e}")

    conn.commit()
    conn.close()
    print("Migration finished.")

if __name__ == '__main__':
    migrate()
