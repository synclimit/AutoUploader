import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import uuid
from datetime import datetime, timedelta
from database.db import SessionLocal, Base, engine
from models import Account, UploadTask
from schemas import QueueStatusEnum

# Ensure tables exist
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Clear existing test data
db.query(UploadTask).delete()
db.query(Account).delete()
db.commit()

# Create 3 Accounts
a1 = Account(id=str(uuid.uuid4()), channel_name="Test Connected 1", authentication_status="Connected")
a2 = Account(id=str(uuid.uuid4()), channel_name="Test Connected 2", authentication_status="Connected")
a3 = Account(id=str(uuid.uuid4()), channel_name="Test Disconnected", authentication_status="Disconnected")
db.add_all([a1, a2, a3])
db.commit()

# Create 12 Tasks
def make_task(status, days_ago, acc_id):
    created = datetime.utcnow() - timedelta(days=days_ago)
    completed = created + timedelta(minutes=5) if status == QueueStatusEnum.completed else None
    return UploadTask(
        id=str(uuid.uuid4()),
        account_id=acc_id,
        status=status.value if hasattr(status, 'value') else status,
        upload_stage="NONE",
        metadata_source="MANUAL",
        source_type="MANUAL_UPLOAD",
        package_folder="/test",
        video_path="/test/vid.mp4",
        created_at=created,
        completed_at=completed
    )

tasks = [
    make_task(QueueStatusEnum.review, 0, a1.id),
    make_task(QueueStatusEnum.review, 1, a2.id),
    make_task(QueueStatusEnum.review, 2, a3.id),
    make_task(QueueStatusEnum.uploading, 3, a1.id),
    make_task(QueueStatusEnum.uploading, 4, a2.id),
    make_task(QueueStatusEnum.scheduled, 5, a3.id),
    make_task(QueueStatusEnum.completed, 0, a1.id),
    make_task(QueueStatusEnum.completed, 1, a2.id),
    make_task(QueueStatusEnum.completed, 2, a3.id),
    make_task(QueueStatusEnum.completed, 3, a1.id),
    make_task(QueueStatusEnum.completed, 4, a2.id),
    make_task(QueueStatusEnum.failed, 6, a3.id),
]

db.add_all(tasks)
db.commit()
print("Database seeded with specific accounts and tasks for validation.")
