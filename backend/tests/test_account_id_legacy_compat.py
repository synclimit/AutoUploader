import pytest
import sqlite3
import tempfile
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base, UploadTask, Channel

def test_account_id_legacy_sqlite_schema_support():
    """Verify that inserting an UploadTask succeeds even if SQLite schema has NOT NULL account_id column."""
    temp_dir = tempfile.mkdtemp()
    db_path = os.path.join(temp_dir, "legacy_app.db")
    engine = create_engine(f"sqlite:///{db_path}")

    # 1. Create table structure via SQLAlchemy create_all
    Base.metadata.create_all(bind=engine)
    
    # 2. Simulate legacy DB state where account_id exists and is NOT NULL
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    # Add account_id as NOT NULL to simulate old schema constraint
    try:
        cur.execute("ALTER TABLE upload_tasks ADD COLUMN account_id VARCHAR NOT NULL DEFAULT 'legacy_id'")
        conn.commit()
    except Exception:
        pass
    conn.close()

    # 3. Connect via ORM Session
    Session = sessionmaker(bind=engine)
    db = Session()

    # Create dummy channel
    ch = Channel(id="ch_legacy_1", alias_name="Test Channel")
    db.add(ch)
    db.commit()

    # 4. Create UploadTask (using channel_id)
    task = UploadTask(
        channel_id="ch_legacy_1",
        package_folder="C:/temp/video.mp4",
        video_path="C:/temp/video.mp4",
        title="Test Legacy Task",
        metadata_source="RENDERER",
        source_type="M1_VIDEO_SPLITTER"
    )
    db.add(task)
    db.commit()

    # 5. Verify insertion succeeded and both account_id & channel_id are populated
    saved_task = db.query(UploadTask).filter_by(id=task.id).first()
    assert saved_task is not None
    assert saved_task.channel_id == "ch_legacy_1"
    assert saved_task.account_id == "ch_legacy_1"
    
    db.close()
