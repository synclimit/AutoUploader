import pytest
import uuid
import json
from datetime import datetime, timedelta, time
import pytz
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, Channel, UploadTask
from schemas import QueueStatusEnum
from services.schedule_allocator import ScheduleAllocator

from sqlalchemy.pool import StaticPool

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

@pytest.fixture
def db():
    db_session = TestingSessionLocal()
    try:
        yield db_session
    finally:
        db_session.close()

@pytest.fixture
def test_channel(db):
    pipeline_cfg = {
        "long": {
            "schedule": ["08:00"],
            "daily_limit": 1,
            "humanize": {
                "enabled": False,
                "min_delay_minutes": 0,
                "max_delay_minutes": 0
            },
            "schedule_mode": "youtube"
        }
    }
    unique_id = str(uuid.uuid4())
    channel = Channel(
        id=unique_id,
        alias_name=f"Test Channel {unique_id}",
        publish_timezone="Asia/Jakarta",
        pipelines=json.dumps(pipeline_cfg)
    )
    db.add(channel)
    db.commit()
    db.refresh(channel)
    return channel

def test_allocate_slot_advances_day_when_today_is_completed(db, test_channel):
    tz = pytz.timezone("Asia/Jakarta")
    now_local = datetime.now(tz)
    
    # Simulate a task uploaded today (COMPLETED)
    today_dt = tz.localize(datetime.combine(now_local.date(), time(8, 0))).astimezone(pytz.UTC).replace(tzinfo=None)
    completed_task = UploadTask(
        id=str(uuid.uuid4()),
        channel_id=test_channel.id,
        pipeline_type="long",
        status=QueueStatusEnum.completed.value,
        package_folder="/test/folder",
        video_path="/test/vid.mp4",
        metadata_source="RENDERER",
        source_type="M1_VIDEO_SPLITTER",
        scheduled_at=today_dt,
        completed_at=datetime.utcnow()
    )
    db.add(completed_task)
    db.commit()

    # Allocate new slot
    scheduled_utc, time_str = ScheduleAllocator.allocate_slot(db, test_channel.id, "long")
    
    # Must be on tomorrow (date > today)
    scheduled_local = pytz.UTC.localize(scheduled_utc).astimezone(tz)
    assert scheduled_local.date() > now_local.date(), f"Expected slot on future date, got {scheduled_local.date()}"
    assert scheduled_local.date() == now_local.date() + timedelta(days=1)
    assert time_str == "08:00"

def test_allocate_slot_sequential_allocations(db, test_channel):
    tz = pytz.timezone("Asia/Jakarta")
    now_local = datetime.now(tz)
    
    dates_seen = set()
    for i in range(3):
        scheduled_utc, time_str = ScheduleAllocator.allocate_slot(db, test_channel.id, "long")
        scheduled_local = pytz.UTC.localize(scheduled_utc).astimezone(tz)
        dates_seen.add(scheduled_local.date())

        # Save as pending task in DB so next call sees it
        t = UploadTask(
            id=str(uuid.uuid4()),
            channel_id=test_channel.id,
            pipeline_type="long",
            status=QueueStatusEnum.watched.value,
            package_folder=f"/test/folder_{i}",
            video_path=f"/test/vid_{i}.mp4",
            metadata_source="RENDERER",
            source_type="M1_VIDEO_SPLITTER",
            scheduled_at=scheduled_utc,
            schedule_time=time_str
        )
        db.add(t)
        db.commit()

    # 3 allocations must span 3 distinct dates!
    assert len(dates_seen) == 3, f"Expected 3 distinct dates, got {dates_seen}"

def test_realign_channel_queue_fixes_doubles(db, test_channel):
    tz = pytz.timezone("Asia/Jakarta")
    now_local = datetime.now(tz)
    tomorrow_date = now_local.date() + timedelta(days=1)
    tomorrow_dt = tz.localize(datetime.combine(tomorrow_date, time(8, 0))).astimezone(pytz.UTC).replace(tzinfo=None)

    # Intentionally insert 4 tasks that all have the SAME date (tomorrow)
    tasks = []
    for i in range(4):
        t = UploadTask(
            id=str(uuid.uuid4()),
            channel_id=test_channel.id,
            pipeline_type="long",
            status=QueueStatusEnum.watched.value,
            package_folder=f"/test/folder_{i}",
            video_path=f"/test/vid_{i}.mp4",
            metadata_source="RENDERER",
            source_type="M1_VIDEO_SPLITTER",
            scheduled_at=tomorrow_dt,
            schedule_time="08:00",
            created_at=datetime.utcnow() + timedelta(minutes=i)
        )
        db.add(t)
        tasks.append(t)
    db.commit()

    # Run realign
    updated = ScheduleAllocator.realign_channel_queue(db, channel_id=test_channel.id, pipeline_type="long")
    assert len(updated) == 4

    assigned_dates = []
    for t in updated:
        local_d = pytz.UTC.localize(t.scheduled_at).astimezone(tz).date()
        assigned_dates.append(local_d)

    # All dates must be unique and strictly sequential
    assert len(set(assigned_dates)) == 4, f"Expected 4 distinct dates, got {assigned_dates}"
    for i in range(len(assigned_dates) - 1):
        assert assigned_dates[i + 1] > assigned_dates[i], "Dates should be strictly increasing day by day"

def test_realign_schedules_endpoint(db, test_channel):
    from fastapi.testclient import TestClient
    from main import app
    from database.db import get_db

    app.dependency_overrides[get_db] = lambda: db

    tz = pytz.timezone("Asia/Jakarta")
    now_local = datetime.now(tz)
    tomorrow_dt = tz.localize(datetime.combine(now_local.date() + timedelta(days=1), time(8, 0))).astimezone(pytz.UTC).replace(tzinfo=None)
    for i in range(2):
        t = UploadTask(
            id=str(uuid.uuid4()),
            channel_id=test_channel.id,
            pipeline_type="long",
            status=QueueStatusEnum.watched.value,
            package_folder=f"/test/folder_{i}",
            video_path=f"/test/vid_{i}.mp4",
            metadata_source="RENDERER",
            source_type="M1_VIDEO_SPLITTER",
            scheduled_at=tomorrow_dt,
            schedule_time="08:00",
            created_at=datetime.utcnow() + timedelta(minutes=i)
        )
        db.add(t)
    db.commit()

    client = TestClient(app)
    response = client.post(f"/api/v1/queue/realign-schedules?channel_id={test_channel.id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    app.dependency_overrides.clear()
